import { createGetInitialProps } from "@mantine/next";
import { Locale } from "db";
import Document, { Head, Html, Main, NextScript } from "next/document";

const getInitialProps = createGetInitialProps();

class MyDocument extends Document {
  static getInitialProps = getInitialProps;

  render() {
    const { locale } = this.props.__NEXT_DATA__;
    const dir = locale === Locale.he ? "rtl" : "ltr";
    return (
      <Html lang={locale} dir={dir} data-theme="renu" className="bg-white">
        <Head>
          <script
            async
            src="https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver,scrollIntoView"
          >
          </script>
        </Head>
        <body className="overscroll-x-contain">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
