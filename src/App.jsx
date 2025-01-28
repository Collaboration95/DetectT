
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NavBar from "./components/Navbar.jsx";
import Prototype from "./components/Prototype.jsx";
import ShopifyRedirect from "./components/ShopifyRedirect.jsx";

function MainApp() {
  const location = useLocation(); // This works because it's within the BrowserRouter context
  const isShopifyRedirect = location.pathname.includes("/shopifyRedirect");

  return (
    <>
      {!isShopifyRedirect && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ShopifyRedirect/:sessionid" element={<ShopifyRedirect />} />
        <Route path="/prototype" element={<Prototype />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}

function Home() {
  return (
    <>
      <div className="font-mono text-4xl text-center">Home</div>
      <div className="font-mono text-lg text-center m-[20px] hover:text-xl transition-all duration-300 ease-in-out">
        1. Click Prototype to test out basic implementation ( without business logic ) <br />
        2. Click Shopify Redirect to see the basic implementation + business logic <br />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}
