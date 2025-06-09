const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#003D11] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 text-sm">{text}</p>
      </div>
    </div>
  );
};

export default Loader;
