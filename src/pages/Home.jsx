import React from 'react'
import Header from '../Components/Header.jsx'
import Footer from '../Components/Footer.jsx'
import image1 from '../ss images/image1.png'
import image2 from '../ss images/image2.png'
import image3 from '../ss images/image3.png'
import image4 from '../ss images/image4.png'
import { FaAngleRight } from 'react-icons/fa6'
import { FaAngleLeft } from 'react-icons/fa6'
import { useEffect, useState } from "react";
import { category_list, games_list } from '../assets/assets.js'
import { Link } from 'react-router-dom'
import SummaryApi from '../common/index.js'

const Home = () => {

  const [currentImage, setCurrentImage] = useState(0)

  const items = games_list

  const desktopImages = [
    image1,
    image2,
    image3,
    image4,
  ]
  const nextImage = () => {
    if (desktopImages.length > (currentImage + 1)) {
      setCurrentImage(preve => preve + 1)
    }
  }

  const previousImage = () => {
    setCurrentImage(preve => preve - 1)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (desktopImages.length > (currentImage + 1)) {
        nextImage()
      } else {
        setCurrentImage(0)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [currentImage])

  return (
    <div className='scrollbar-none bg-gradient-to-b from-gray-900 to-black'>
      <Header />
      <div className='container min-w-full mx-auto px-4 group bg-transparent h-[100%] mt-32'>
        <div className='h-64 md:h-72 relative'>
          <div className='absolute z-10 h-full w-full md:flex items-center hidden'>
            <div className='w-full ml-[-100px] pt-12 mt-10 flex justify-between text-2xl md:text-5xl'>
              <button onClick={previousImage} className='text-slate-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'><FaAngleLeft /></button>
              <button onClick={nextImage} className='text-slate-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'><FaAngleRight /></button>
            </div>
          </div>
          <div className='flex h-[400px] w-full overflow-hidden'>
            {
              desktopImages.map((imageURL, index) => {
                return (
                  <div className='h-full min-w-full min-h-full transition-all' key={imageURL} style={{ transform: `translateX(-${currentImage * 100}%)` }}>
                    <img src={imageURL} className='w-[100%] h-full' />
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
      <div className="flex gap-6 w-[100%] justify-around bg-transparent">
        {category_list.map((item, index) => {
          return (
            <Link to={`/game-category/${item.id}`} className='mt-36 size-32 shadow-lg shadow-green-500 rounded-full h-44'>
              <img className='rounded-full' src={item.category_image} />
              <p className='bg-transparent text-white text-center'>{item.category_name}</p>
            </Link>
          )
        })}
      </div>
      <div className='p-6 bg-transparent'>
        <h3 class="text-6xl text-left font-semibold text-green-400">Hot Picks~</h3>
        <div class="flex justify-between mt-6 space-x-8">

        <ul class="grid grid-cols-4 gap-5 justify-between mt-6 space-x-8" >
          {items.map(item => (
            <li key={item.gameId}>
              <Link to={`/game/${item.gameId}`}>
                <div class="w-60 h-60 bg-cover p-6 rounded-full shadow-lg relative" style={{ backgroundImage: `url(${item.game_icon})` }} >
                  <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex flex-col justify-center items-center text-center rounded-lg transition-opacity duration-300">
                    <h4 class="text-xl font-semibold text-white mb-4">{item.game_name}</h4>
                    <p class="text-gray-400">{item.game_description}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul></div>
      </div>
      <Footer />
    </div>
  )
}

export default Home

