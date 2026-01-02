const Test = () => {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">
            Tailwind CSS Test
          </h1>
          <div className="bg-red-500 text-white p-8 rounded-lg shadow-lg mb-4">
            This should be RED
          </div>
          <div className="bg-green-500 text-white p-8 rounded-lg shadow-lg mb-4">
            This should be GREEN
          </div>
          <div className="bg-blue-500 text-white p-8 rounded-lg shadow-lg">
            This should be BLUE
          </div>
        </div>
      </div>
    );
  };
  
  export default Test;