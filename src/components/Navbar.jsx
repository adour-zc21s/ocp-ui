import React, { useEffect } from 'react';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';

import { CiShoppingCart, CiChat1, CiBellOn} from "react-icons/ci";
import { GoQuote } from "react-icons/go";
import { MdKeyboardArrowDown } from 'react-icons/md';

import { PiListDuotone, PiShoppingCartDuotone, PiChatCenteredDotsDuotone, PiBellDuotone} from "react-icons/pi";

import { Cart, Chat, Notification, UserProfile } from '.';
import { useStateContext } from '../contexts/ContextProvider';

const NavButton = ({ title, customFunc, icon, color, dotColor }) => (
  <TooltipComponent content={title} position="BottomCenter">
    <button
      type="button"
      onClick={() => customFunc()}
      style={{ color }}
      className="relative text-xl rounded-full p-3 hover:bg-light-gray"
    >
      <span
        style={{ background: dotColor }}
        className="absolute inline-flex rounded-full h-2 w-2 right-2 top-2"
      />
      {icon}
    </button>
  </TooltipComponent>
);

const Navbar = () => {
  const { currentColor, activeMenu, setActiveMenu, handleClick, isClicked, setScreenSize, screenSize } = useStateContext();

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email || 'User';
  const userName = userEmail.split('@')[0] || 'User';
  
  const BACKEND_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, ''); 

  let profileImage = 'https://via.placeholder.com/150';
  
  if (user.profileImageUrl || user.profile_image_url) {
    const imgPath = user.profileImageUrl || user.profile_image_url;
    
    if (imgPath.startsWith('http')) {
      profileImage = imgPath;
    } else {
      const cleanFileName = imgPath.replace(/^\//, '');
      
      // Changed 'profile-images' to 'profile-pictures' to match your WebConfig handler
      profileImage = `${BACKEND_URL}/uploads/profile-pictures/${cleanFileName}`;
    }
  }

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (screenSize <= 900) {
      setActiveMenu(false);
    } else {
      setActiveMenu(true);
    }
  }, [screenSize]);

  const handleActiveMenu = () => setActiveMenu(!activeMenu);

  return (
    <div className="flex justify-between p-2 md:ml-6 md:mr-6 relative">

      <NavButton title="Menu" customFunc={handleActiveMenu} color={currentColor} icon={<PiListDuotone />} />
      <div className="flex">
        <NavButton title="Cart" customFunc={() => handleClick('cart')} color={currentColor} icon={<PiShoppingCartDuotone />} />
        <NavButton title="Chat" dotColor="#03C9D7" customFunc={() => handleClick('chat')} color={currentColor} icon={<PiChatCenteredDotsDuotone />} />
        <NavButton title="Notification" dotColor="rgb(254, 201, 15)" customFunc={() => handleClick('notification')} color={currentColor} icon={<PiBellDuotone />} />
        <TooltipComponent content="Profile" position="BottomCenter">
          <div
            className="flex items-center gap-2 cursor-pointer p-1 hover:bg-light-gray rounded-lg"
            onClick={() => handleClick('userProfile')}
          >
            <img
              className="rounded-full w-8 h-8 object-cover"
              src={profileImage}
              alt="user-profile"
            />
            <p>
              <span className="text-gray-400 text-14">Hi,</span>{' '}
              <span className="text-gray-400 font-bold ml-1 text-14">
                {userName}
              </span>
            </p>
            <MdKeyboardArrowDown className="text-gray-400 text-14" />
          </div>
        </TooltipComponent>

        {isClicked.cart && (<Cart />)}
        {isClicked.chat && (<Chat />)}
        {isClicked.notification && (<Notification />)}
        {isClicked.userProfile && (<UserProfile />)}
      </div>
    </div>
  );
};

export default Navbar;