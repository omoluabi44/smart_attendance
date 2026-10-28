import { Roboto } from 'next/font/google';

export const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

// Alias all legacy font exports to Roboto so the entire project strictly uses Roboto
export const inter = roboto;
export const lusitana = roboto;
export const montserrat = roboto;
export const jetbrainsMono = roboto;

