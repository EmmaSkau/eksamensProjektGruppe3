// src/components/TestComponent.jsx
import React from 'react';

const TestComponent = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">Tailwind Test</h1>
      <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
        This is a red box
      </div>
      <div className="bg-blue-500 text-white p-4 rounded-lg mb-4">
        This is a blue box
      </div>
      <div className="bg-green-500 text-white p-4 rounded-lg mb-4">
        This is a green box
      </div>
      <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
        Test Button
      </button>
    </div>
  );
};

export default TestComponent;