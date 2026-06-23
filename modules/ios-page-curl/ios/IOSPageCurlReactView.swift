import ExpoModulesCore
import UIKit

// RN-facing wrapper that hosts a UIPageViewController in the
// .pageCurl transition style — the same curl Apple Books / iBooks uses.
//
// JS contract: three children rendered in a known order
//   subviews[0] = prev page  (lower pageIndex)
//   subviews[1] = current page
//   subviews[2] = next page  (higher pageIndex)
//
// We wrap each RN child view in a host UIViewController, then drive a
// UIPageViewController whose data source vends the prev / next VC and
// whose delegate fires `onPageTurn` to JS on a completed transition.
//
// Direction handling: JS passes `direction = "rtl" | "ltr"`. For RTL,
// "next" means lower pageIndex visually (book reads right-to-left), so
// we swap which VC the data source returns for "before" vs "after".
public class IOSPageCurlReactView: ExpoView {
  public let onPageTurn = EventDispatcher()
  // Single-tap on the page (no swipe motion) — used by JS to toggle
  // the floating chrome (back button + bottom sheet) like Apple Books.
  public let onTap = EventDispatcher()

  // JS-supplied direction string. RTL flips which VC counts as "next"
  // for the UIPageViewController data source.
  var directionString: String = "rtl"

  // Bounds flags from JS. At the very first / last page of the book
  // the corresponding slot has no real content, so the data source
  // refuses the gesture in that direction.
  var hasPrev: Bool = true
  var hasNext: Bool = true

  // The vended view controllers, one per child slot. Updated whenever
  // React mounts/replaces a child at that slot.
  private let prevVC = PageWrapperVC()
  private let currVC = PageWrapperVC()
  private let nextVC = PageWrapperVC()

  private var pageController: UIPageViewController?
  private var pageControllerDelegate: PageCurlDelegate?

  // RN children get re-parented into the wrapper VCs immediately, but
  // we hold weak refs so we can detect when React replaces them.
  private weak var prevChild: UIView?
  private weak var currChild: UIView?
  private weak var nextChild: UIView?

  // Page index last applied from JS — gates re-seeding so a noisy prop
  // update doesn't reset the controller mid-animation.
  private var lastAppliedPageIndex: Int = Int.min

  // Set while we're programmatically setting the page controller's
  // active VC (after a JS page change). Suppresses the delegate's
  // didFinishAnimating callback that would otherwise re-fire onPageTurn
  // for the swap we ourselves triggered.
  private var isProgrammaticTransition: Bool = false

  // Held while a turn is settling so the brief window between React
  // shifting children content (subview[2] renders new "next" instead
  // of the just-landed page) and our reseed of the page controller
  // can't show a flash. See handlePageTransitionCompleted.
  private weak var transitionMask: UIView?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    setUpPageController()
    // Tap recognizer for chrome-toggle. cancelsTouchesInView=false so
    // touches still reach UIPageViewController's internal pan
    // recognizer — they coexist: UIPageViewController's pan needs
    // movement to recognize, this tap needs none, so they don't fight.
    let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap))
    tap.numberOfTapsRequired = 1
    tap.numberOfTouchesRequired = 1
    tap.cancelsTouchesInView = false
    addGestureRecognizer(tap)
  }

  @objc private func handleTap() {
    onTap([:])
  }

  private func setUpPageController() {
    // Spine on the RIGHT (.max) so pages pivot from the right edge —
    // the binding-on-the-right look of a physical mushaf. With .max
    // spine, UIPageViewController naturally maps swipe L→R to the
    // "after" gesture and swipe R→L to "before", which matches Arabic
    // reading order without any direction-based mapping in the data
    // source.
    let opts: [UIPageViewController.OptionsKey: Any] = [
      .spineLocation: NSNumber(value: UIPageViewController.SpineLocation.max.rawValue)
    ]
    let pc = UIPageViewController(
      transitionStyle: .pageCurl,
      navigationOrientation: .horizontal,
      options: opts
    )
    pc.dataSource = pageControllerDataSource
    let delegate = PageCurlDelegate(owner: self)
    pc.delegate = delegate
    pageControllerDelegate = delegate

    pc.view.backgroundColor = .clear
    pc.view.translatesAutoresizingMaskIntoConstraints = false
    addSubview(pc.view)
    NSLayoutConstraint.activate([
      pc.view.topAnchor.constraint(equalTo: topAnchor),
      pc.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      pc.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      pc.view.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
    pageController = pc

    // Seed with the current-page VC so the controller's
    // `viewControllers[0]` is always non-nil.
    pc.setViewControllers([currVC], direction: .forward, animated: false)
  }

  // MARK: - Data source

  private lazy var pageControllerDataSource: PageCurlDataSource = {
    return PageCurlDataSource(owner: self)
  }()

  // Spine is on the right (.max) — animation pivots from the right
  // edge, matching how a real mushaf turns. The page-order convention
  // is "swipe in the reading direction = advance": Arabic reads R→L,
  // so swipe R→L advances to the next page in the Quran, swipe L→R
  // goes back. Mechanically, that means we return the NEXT logical
  // page for the "before" gesture (peeling from the right edge — R→L)
  // and the PREVIOUS page for the "after" gesture (peeling from the
  // left edge — L→R).
  func viewController(before vc: UIViewController) -> UIViewController? {
    if vc === currVC {
      return nextPagePresent()
    }
    return nil
  }

  func viewController(after vc: UIViewController) -> UIViewController? {
    if vc === currVC {
      return prevPagePresent()
    }
    return nil
  }

  // Hide the slot if JS says there's no real page in that direction.
  // The wrapping `View` is always rendered by React (just with `null`
  // content at the boundary), so checking the child reference isn't
  // enough — JS sends explicit hasPrev/hasNext flags instead.
  private func prevPagePresent() -> UIViewController? {
    return (hasPrev && prevChild != nil) ? prevVC : nil
  }

  private func nextPagePresent() -> UIViewController? {
    return (hasNext && nextChild != nil) ? nextVC : nil
  }

  // MARK: - JS prop bridge

  @objc public func applyPageIndex(_ index: Int) {
    guard index != lastAppliedPageIndex else { return }
    lastAppliedPageIndex = index
    // Defer one runloop tick so React's commit has produced the
    // updated child views before we reseed the controller.
    DispatchQueue.main.async { [weak self] in
      self?.reseedPageController(direction: .forward)
    }
  }

  private func reseedPageController(direction: UIPageViewController.NavigationDirection) {
    guard let pc = pageController else { return }
    isProgrammaticTransition = true
    pc.setViewControllers([currVC], direction: direction, animated: false) { [weak self] _ in
      self?.isProgrammaticTransition = false
      // Drop the transition mask after a tiny extra delay so the
      // newly-mounted currVC content (and any async SVG paint inside
      // it) has a frame or two to settle before the user sees it.
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [weak self] in
        self?.transitionMask?.removeFromSuperview()
        self?.transitionMask = nil
      }
    }
  }

  // MARK: - RN child interception

  // Fabric calls these for React-rendered children. We re-parent the
  // child into the appropriate wrapper VC (so UIPageViewController can
  // host it as one of its page contents) and intentionally do NOT call
  // super — the base RCTViewComponentView implementation asserts that
  // the child's superview is `self` and crashes on teardown otherwise.
  // The page controller's own view is added directly via addSubview in
  // setUpPageController, so it bypasses this Fabric path entirely.
  public override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    // RN children arrive in source order: 0=prev, 1=current, 2=next.
    switch index {
    case 0:
      prevChild = childComponentView
      prevVC.setContent(childComponentView)
    case 1:
      currChild = childComponentView
      currVC.setContent(childComponentView)
    case 2:
      nextChild = childComponentView
      nextVC.setContent(childComponentView)
    default:
      // Extra children we don't expect — discard so Fabric layout
      // doesn't try to position them on top of the page controller.
      break
    }
  }

  public override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    // Symmetric teardown: pull the child out of whichever wrapper VC
    // it was parented to. Calling super here would assert that the
    // child's superview is `self` (it isn't — we re-parented) and
    // crash. So we just clean up our own slot tracking.
    if childComponentView === prevChild {
      childComponentView.removeFromSuperview()
      prevChild = nil
    } else if childComponentView === currChild {
      childComponentView.removeFromSuperview()
      currChild = nil
    } else if childComponentView === nextChild {
      childComponentView.removeFromSuperview()
      nextChild = nil
    } else {
      // Unrecognized child — delegate to super so Fabric can do its
      // standard cleanup.
      super.unmountChildComponentView(childComponentView, index: index)
    }
  }

  // MARK: - Delegate callback

  func handlePageTransitionCompleted(_ completed: Bool, finishedVC: UIViewController?) {
    guard completed, !isProgrammaticTransition else { return }
    guard let finished = finishedVC else { return }

    // nextVC / prevVC are always the wrappers for pageIndex ± 1
    // (regardless of direction), so the delta is straightforward.
    let delta: Int
    if finished === nextVC {
      delta = 1
    } else if finished === prevVC {
      delta = -1
    } else {
      // currVC ended up active — gesture cancelled, no change.
      return
    }

    // Snapshot the page we just landed on and pin it as an overlay.
    // Without this the user sees a brief flash: React shifts the JSX
    // children content (subview[2] re-renders from N+1 to N+2 because
    // `nextNum` has incremented), and the page controller's active VC
    // — which still references that same subview — now paints the
    // wrong page until our reseed swaps to currVC. The snapshot covers
    // that window with a still image of the correct page.
    if let snap = finished.view.snapshotView(afterScreenUpdates: false) {
      snap.frame = bounds
      snap.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      snap.isUserInteractionEnabled = false
      addSubview(snap)
      transitionMask?.removeFromSuperview()
      transitionMask = snap
    }

    onPageTurn(["delta": delta])
  }

  public override func willMove(toWindow newWindow: UIWindow?) {
    super.willMove(toWindow: newWindow)
    if newWindow == nil {
      // Leaving the window — detach from the parent view controller
      // via the containment APIs so UIKit can tear the page controller
      // down cleanly. Without willMove(toParent: nil) +
      // removeFromParent, the page controller will crash on dealloc
      // because it still thinks it's owned by a parent that's already
      // gone. Also drop the delegate / data source refs so a
      // late-firing callback doesn't reach a half-torn-down view.
      pageController?.delegate = nil
      pageController?.dataSource = nil
      if pageController?.parent != nil {
        pageController?.willMove(toParent: nil)
        pageController?.removeFromParent()
      }
      // Cancel the snapshot mask — its asyncAfter dismissal block uses
      // [weak self] so it's safe, but removing the view now keeps the
      // teardown clean.
      transitionMask?.removeFromSuperview()
    }
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    guard window != nil, let pc = pageController, pc.parent == nil else { return }
    // Attach to the nearest enclosing UIViewController so the page
    // controller's containment is set up correctly. RN doesn't give us
    // a parent VC directly, so we walk the responder chain.
    if let parent = findParentViewController() {
      parent.addChild(pc)
      pc.didMove(toParent: parent)
    }
    pc.delegate = pageControllerDelegate
    pc.dataSource = pageControllerDataSource
  }

  private func findParentViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let r = responder?.next {
      if let vc = r as? UIViewController {
        return vc
      }
      responder = r
    }
    return nil
  }
}

// MARK: - Wrapper view controller

// Simple host: its `view` is the RN child re-parented in. We swap the
// child via setContent so the same wrapper VC instance can be reused
// across page swaps without UIPageViewController noticing.
class PageWrapperVC: UIViewController {
  func setContent(_ child: UIView) {
    // Replace whatever's in our view hierarchy with the new child.
    view.subviews.forEach { $0.removeFromSuperview() }
    if view.bounds.size == .zero {
      // First-mount before layout — give a sane initial size so the
      // RN child has room to lay out. Page controller will resize us
      // shortly after via the parent view's autolayout.
      view.frame = UIScreen.main.bounds
    }
    child.frame = view.bounds
    child.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(child)
  }
}

// MARK: - Data source bridge

// Lightweight NSObject to satisfy UIPageViewControllerDataSource (which
// requires NSObjectProtocol). Delegates everything back to the owning
// react view.
class PageCurlDataSource: NSObject, UIPageViewControllerDataSource {
  weak var owner: IOSPageCurlReactView?

  init(owner: IOSPageCurlReactView) {
    self.owner = owner
    super.init()
  }

  func pageViewController(
    _ pageViewController: UIPageViewController,
    viewControllerBefore viewController: UIViewController
  ) -> UIViewController? {
    return owner?.viewController(before: viewController)
  }

  func pageViewController(
    _ pageViewController: UIPageViewController,
    viewControllerAfter viewController: UIViewController
  ) -> UIViewController? {
    return owner?.viewController(after: viewController)
  }
}

// MARK: - Delegate bridge

class PageCurlDelegate: NSObject, UIPageViewControllerDelegate {
  weak var owner: IOSPageCurlReactView?

  init(owner: IOSPageCurlReactView) {
    self.owner = owner
    super.init()
  }

  func pageViewController(
    _ pageViewController: UIPageViewController,
    didFinishAnimating finished: Bool,
    previousViewControllers: [UIViewController],
    transitionCompleted completed: Bool
  ) {
    let finishedVC = pageViewController.viewControllers?.first
    owner?.handlePageTransitionCompleted(completed, finishedVC: finishedVC)
  }
}
