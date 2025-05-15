import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-burgundy py-8 mt-12 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start">
              <span className="font-bold text-xl">HJV</span>
              <span className="ml-2 text-sm font-medium">Ledelsestræner</span>
            </div>
            <p className="text-gray-500 text-sm mt-2 text-center md:text-left">
              Et digitalt træningsværktøj til Hjemmeværnsskolens ledelseskurser
            </p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} Hjemmeværnsskolen
            </p>
            <div className="mt-2 space-x-4">
              <Link to="/" className="text-sm text-burgundy hover:text-burgundy-dark">
                Hjem
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/login" className="text-sm text-burgundy hover:text-burgundy-dark">
                Log ind
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/register" className="text-sm text-burgundy hover:text-burgundy-dark">
                Opret konto
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
