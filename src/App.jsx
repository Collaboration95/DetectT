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
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="/about" element={<About />} />
          <Route path="/prototype" element={<Prototype />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
