import { useData } from '../context/DataContext';
import { GlobalShader } from './GlobalShader';

export function GlobalWave() {
  const { theme } = useData();

  if (theme === 'monochrome') {
    return <GlobalShader />;
  }

  // We explicitly return null enforcing structural silence eliminating 'static non-moving' waves from ALL generic modes.
  return null;
}
