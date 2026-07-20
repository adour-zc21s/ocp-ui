import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineCancel } from 'react-icons/md';

import { Button } from '.';
import { userProfileData } from '../data/dummy';
import { useStateContext } from '../contexts/ContextProvider';

const UserProfile = () => {
  const { currentColor } = useStateContext();
  const navigate = useNavigate();

  const BACKEND_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');  

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email || 'user@example.com';
  const userName = user.email?.split('@')[0] || 'User';

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

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    
    // Redirect to login page
    navigate('/login', { replace: true });
  };

  return (
    <div className="nav-item absolute right-1 top-16 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-lg dark:text-gray-200">User Profile</p>
        <Button
          icon={<MdOutlineCancel />}
          color="rgb(153, 171, 180)"
          bgHoverColor="light-gray"
          size="2xl"
          borderRadius="50%"
        />
      </div>
      <div className="flex gap-5 items-center mt-6 border-color border-b-1 pb-6">
        <img
          className="rounded-full h-24 w-24 object-cover"
          src={profileImage}
          alt="user-profile"
          onError={(e) => {
            // Safe fallback if the URL breaks, throws a 404, or is blocked
            e.target.src = 'https://via.placeholder.com/150';
          }}
        />
        <div>
          <p className="font-semibold text-xl dark:text-gray-200">{userName}</p>
          <p className="text-gray-500 text-sm dark:text-gray-400">User</p>
          <p className="text-gray-500 text-sm font-semibold dark:text-gray-400">{userEmail}</p>
        </div>
      </div>
      <div>
        {userProfileData.map((item, index) => (
          <div key={index} className="flex gap-5 border-b-1 border-color p-4 hover:bg-light-gray cursor-pointer  dark:hover:bg-[#42464D]">
            <button
              type="button"
              style={{ color: item.iconColor, backgroundColor: item.iconBg }}
              className=" text-xl rounded-lg p-3 hover:bg-light-gray"
            >
              {item.icon}
            </button>

            <div>
              <p className="font-semibold dark:text-gray-200 ">{item.title}</p>
              <p className="text-gray-500 text-sm dark:text-gray-400"> {item.desc} </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Button
          color="white"
          bgColor={currentColor}
          text="Logout"
          borderRadius="10px"
          width="full"
          customFunc={handleLogout}
        />
      </div>
    </div>

  );
};

export default UserProfile;