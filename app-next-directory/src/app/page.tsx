import Link from 'next/link';

const HomePage = () => {
  const cities = [
    {
      name: 'Greenville',
      tagline: 'Lush landscapes & eco-innovations.',
      imageUrl: 'https://via.placeholder.com/600x800.png?text=Greenville',
    },
    {
      name: 'Coast Rica',
      tagline: 'Sustainable shores & vibrant culture.',
      imageUrl: 'https://via.placeholder.com/600x800.png?text=Coast+Rica',
    },
    {
      name: 'Mountain View Peaks',
      tagline: 'Serene trails & conscious living.',
      imageUrl: 'https://via.placeholder.com/600x800.png?text=Mountain+View',
    },
  ];

  return (
    // Removed p-4 from here to allow hero to be full width if needed
    <div>
      {/* Hero Section */}
      <div className="relative bg-gray-800 text-white py-20 md:py-32 text-center">
        {/* Placeholder Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage:
              "url('https://via.placeholder.com/1920x1080.png?text=Eco-Friendly+Travel')",
          }}
        ></div>
        {/* Overlay to darken the background image for better text readability */}
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        {/* Content */}
        <div className="relative z-20 container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Travel Sustainably. Work Remotely.
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Find eco-friendly destinations and resources for the conscious digital nomad.
          </p>
          <div className="mt-8 text-center">
            <Link href="/listings" legacyBehavior>
              <a className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105">
                Explore Destinations
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* Original Welcome Text - consider removing or integrating into hero */}
      <div className="p-4">
        <h1>Welcome to the Homepage</h1>
        <p>This is a placeholder page.</p>
      </div>

      {/* City Carousel Placeholder - Multiple Cards Example */}
      <div className="mt-8 p-4">
        {' '}
        {/* Added p-4 here for spacing */}
        <h2 className="text-2xl font-bold mb-6 text-center">Featured Cities</h2>
        <div className="flex space-x-6 overflow-x-auto p-4 justify-center">
          {cities.map(city => (
            <div
              key={city.name}
              className="flex-shrink-0 w-72 h-96 rounded-lg overflow-hidden shadow-xl group"
            >
              <img
                src={city.imageUrl}
                alt={`Image of ${city.name}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-end">
                <h3 className="text-white text-xl font-semibold">{city.name}</h3>
                <p className="text-gray-200 text-sm mt-1">{city.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
