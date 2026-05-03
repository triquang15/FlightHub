import React from 'react'

const HomePage = () => {
  return (
    <div className='min-h-screen'>
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-blue-950 
        dark:to-slate-950 min-h-[85vh]s flex items-center overflow-hidden">
        <div className='searchBox relative max-w-7xl max-auto px-4 sm:px-6 lg:px-8 w-full py-12 z-10'>
          <div className='text-center mb-8'>
            <h1 className="text-2xl md:text-3xl lg:text-3xl font-bold text-white mb-4 leading-tight">
              Let's Start Your Journey!
            </h1>
            <p className=" text-blue-100 max-w-2xl mx-auto">
              Discover the world with our amazing flight deals. Book now and save big!
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
