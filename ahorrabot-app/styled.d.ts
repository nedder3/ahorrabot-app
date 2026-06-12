// styled.d.ts
import 'styled-components';
import { lightTheme } from './context/theme-context';

type CustomTheme = typeof lightTheme;

declare module 'styled-components/native' {
  export interface DefaultTheme extends CustomTheme {}
}

declare module 'styled-components' {
  export interface DefaultTheme extends CustomTheme {}
}
