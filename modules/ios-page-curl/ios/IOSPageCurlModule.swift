import ExpoModulesCore

// Expo module + Fabric view declaration. The actual view + curl logic
// lives in IOSPageCurlReactView; this file is just the surface JS sees.
public class IOSPageCurlModule: Module {
  public func definition() -> ModuleDefinition {
    Name("IOSPageCurl")

    View(IOSPageCurlReactView.self) {
      // Direction the page-turn navigates. UIPageViewController only
      // supports horizontal in the page-curl style, so this is mostly
      // here to clarify RTL vs LTR mapping on the JS side.
      Prop("direction") { (view: IOSPageCurlReactView, value: String) in
        view.directionString = value
      }

      // Current page index from JS. Whenever this changes, the native
      // side reseeds the page view controller with the matching child.
      Prop("pageIndex") { (view: IOSPageCurlReactView, value: Int) in
        view.applyPageIndex(value)
      }

      // Bounds flags from JS: at the first / last page of the book the
      // prev or next slot is rendered with null content, but the React
      // `View` wrapper is still present — so the native side can't tell
      // "no page" from the view itself. JS sends these explicitly so
      // the data source can refuse the gesture at the boundaries and
      // the curl snap-backs instead of advancing to a blank page.
      Prop("hasPrev") { (view: IOSPageCurlReactView, value: Bool) in
        view.hasPrev = value
      }
      Prop("hasNext") { (view: IOSPageCurlReactView, value: Bool) in
        view.hasNext = value
      }

      Events("onPageTurn", "onTap")
    }
  }
}
