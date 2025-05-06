import Layout from "../components/Layout";
import "../styles/globals.css"; // Możesz zostawić pusty albo dodać globalne style

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
