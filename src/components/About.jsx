import React from "react";

export default function About() {
  return (
    <>
      <div className="font-mono text-3xl text-center mt-[10px] hover:text-red-900 transition-all duration-200 ease-linear">
        About
      </div>
      <div className="font-mono text-lg text-center m-[20px] hover:text-xl transition-all duration-300 ease-in-out">
        This project is a proof of concept for a part of Fit_Back ,<br /> It
        uses device camera and gets pictures of users in specifc positions to
        get data to train and predict their clothing sizes
      </div>
    </>
  );
}
