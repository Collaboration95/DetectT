import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import About from "./components/About.jsx";
import NavBar from "./components/Navbar.jsx";
import Prototype from "./components/Prototype.jsx";
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/prototype" element={<Prototype />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function Home() {
  return (
    <>
      <div className="font-mono text-4xl text-center">Home</div>
      <div className="font-mono text-lg text-center m-[20px] hover:text-xl transition-all duration-300 ease-in-out">
        I quite do not know what to write here , <br /> everything that needs to
        be written here is already at the about section
      </div>
    </>
  );
}

export default App;
