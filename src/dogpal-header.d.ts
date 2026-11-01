// Types for the shared <dogpal-header> element (https://dogpal.app/shared/dogpal-header.js).
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'dogpal-header': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        app?: string;
        initial?: string;
        'app-href'?: string;
      };
    }
  }
}
