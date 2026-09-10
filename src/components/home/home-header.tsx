import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { HEADER_STYLES, resolveHeaderStyle } from '@/src/theme/header-style';
import { ClassicHomeHeader } from './home-header-classic';
import { CountdownHomeHeader } from './home-header-countdown';

/**
 * Home header dispatcher. Renders the header variant the masjid has chosen
 * (`mosques.header_style` → `MasjidConfig.headerStyle`), defaulting to the
 * classic header. Keeps a single `<HomeHeader />` seam in `(main)/index.tsx`.
 */
export function HomeHeader() {
  const { headerStyle } = useMasjidConfig();
  const style = HEADER_STYLES[resolveHeaderStyle(headerStyle)];

  if (!style.countdown) return <ClassicHomeHeader />;
  return <CountdownHomeHeader align={style.align} />;
}
