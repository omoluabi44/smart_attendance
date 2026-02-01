import { Inter, Lusitana, Roboto,Montserrat} from 'next/font/google';

 
export const inter = Inter({ subsets: ['latin'] });

export const lusitana = Lusitana({ 
    weight: ['400', '700'],
    subsets: ['latin'] 
});
export const roboto = Roboto({ 
    weight: ['400', '700'],
    subsets: ['latin'] ,
      variable: '--font-roboto' 
});

export const montserrat = Montserrat({ 
    weight: ['400', '700'],
    subsets: ['latin'],
    variable: '--font-montserrat' 
});

