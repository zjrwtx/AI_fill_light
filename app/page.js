'use client';

import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customSettings, setCustomSettings] = useState({
    brightness: 50,
    color: '#ffffff',
    pattern: 'steady',
    saturation: 50,
    screenBrightness: 75
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isPulsing, setIsPulsing] = useState(false);
  const [isStrobing, setIsStrobing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [modelType, setModelType] = useState('meta-llama/llama-4-scout:free');
  const [apiKey, setApiKey] = useState('');
  const [userPreference, setUserPreference] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushToken, setPushToken] = useState('');
  const fileInputRef = useRef(null);
  const preferenceRef = useRef(null);

  const colorPresets = [
    { id: 1, name: '蜜桃甜心', color: '#FFB6C1', backgroundColor: '#FFB6C1', description: '治愈系少女心✨' },
    { id: 2, name: '薰衣草', color: '#9370DB', backgroundColor: '#9370DB', description: '高级感氛围感拉满' },
    { id: 3, name: '薄荷冰淇淋', color: '#98FB98', backgroundColor: '#98FB98', description: '清爽感拍照yyds' },
    { id: 4, name: '珊瑚橘', color: '#FF7F50', backgroundColor: '#FF7F50', description: '显白神器超上镜' },
    { id: 5, name: '星空蓝', color: '#4682B4', backgroundColor: '#4682B4', description: '高级感质感拉满' },
    { id: 6, name: '奶茶棕', color: '#DEB887', backgroundColor: '#DEB887', description: '日杂感温柔氛围' },
  ];

  // 从localStorage加载保存的模板和API设置
  useEffect(() => {
    const storedTemplates = localStorage.getItem('savedTemplates');
    if (storedTemplates) {
      setSavedTemplates(JSON.parse(storedTemplates));
    }
    
    // 加载保存的API密钥和模型类型
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    
    const storedModelType = localStorage.getItem('modelType');
    if (storedModelType) {
      setModelType(storedModelType);
    }
  }, []);
  
  // 当API密钥或模型类型变化时保存到localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('apiKey', apiKey);
    }
    
    if (modelType) {
      localStorage.setItem('modelType', modelType);
    }
  }, [apiKey, modelType]);

  // 初始化推送通知
  useEffect(() => {
    const initPushNotifications = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // 请求权限
          const permStatus = await PushNotifications.requestPermissions();
          
          if (permStatus.receive === 'granted') {
            setNotificationsEnabled(true);
            
            // 注册推送
            await PushNotifications.register();
            
            // 添加各种监听器
            PushNotifications.addListener('registration', (token) => {
              setPushToken(token.value);
              console.log('Push registration success, token: ' + token.value);
            });
            
            PushNotifications.addListener('registrationError', (error) => {
              console.error('Error on registration: ' + JSON.stringify(error));
            });
            
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
              console.log('Push notification received: ' + JSON.stringify(notification));
            });
            
            PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
              console.log('Push notification action performed: ' + JSON.stringify(action));
            });
          }
        } catch (error) {
          console.error('推送通知初始化失败:', error);
        }
      }
    };
    
    initPushNotifications();
    
    // 清理函数
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  // 发送本地测试通知
  const sendLocalNotification = () => {
    if (Capacitor.isNativePlatform() && notificationsEnabled) {
      // 使用Capacitor API发送本地通知
      PushNotifications.schedule({
        notifications: [
          {
            title: '闪亮补光已准备就绪',
            body: '点击开启完美自拍模式',
            id: new Date().getTime(),
            sound: true,
            attachments: null,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } else {
      // 在web环境中使用浏览器通知API
      if (Notification.permission === 'granted') {
        new Notification('闪亮补光已准备就绪', {
          body: '点击开启完美自拍模式'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('闪亮补光已准备就绪', {
              body: '点击开启完美自拍模式'
            });
          }
        });
      }
    }
  };

  // 处理脉冲效果
  useEffect(() => {
    if (customSettings.pattern === 'pulse' && isFullscreen) {
      setIsPulsing(true);
      const interval = setInterval(() => {
        setIsPulsing(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsPulsing(false);
    }
  }, [customSettings.pattern, isFullscreen]);

  // 处理频闪效果
  useEffect(() => {
    if (customSettings.pattern === 'strobe' && isFullscreen) {
      setIsStrobing(true);
      const interval = setInterval(() => {
        setIsStrobing(prev => !prev);
      }, 200);
      return () => clearInterval(interval);
    } else {
      setIsStrobing(false);
    }
  }, [customSettings.pattern, isFullscreen]);

  const handleColorSelect = (preset) => {
    setSelectedTemplate(preset);
    setCustomSettings(prev => ({
      ...prev,
      color: preset.color
    }));
  };

  const handleCustomChange = (setting, value) => {
    setCustomSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const saveTemplate = () => {
    if (newTemplateName.trim()) {
      const newTemplate = {
        id: Date.now(),
        name: newTemplateName,
        ...customSettings
      };
      const updatedTemplates = [...savedTemplates, newTemplate];
      setSavedTemplates(updatedTemplates);
      
      // 保存到本地存储
      localStorage.setItem('savedTemplates', JSON.stringify(updatedTemplates));
      
      setShowSaveTemplateModal(false);
      setNewTemplateName('');
    }
  };

  const deleteTemplate = (id) => {
    const updatedTemplates = savedTemplates.filter(template => template.id !== id);
    setSavedTemplates(updatedTemplates);
    
    // 更新本地存储
    localStorage.setItem('savedTemplates', JSON.stringify(updatedTemplates));
  };

  const getDisplayColor = () => {
    if (customSettings.pattern === 'strobe' && isStrobing) {
      return '#000000';
    }
    return customSettings.color;
  };
  
  // 使用模板并直接进入补光模式
  const applyTemplate = (template) => {
    setCustomSettings({
      brightness: template.brightness,
      color: template.color,
      pattern: template.pattern,
      saturation: customSettings.saturation,
      screenBrightness: customSettings.screenBrightness
    });
    // 直接进入全屏模式
    setIsFullscreen(true);
    
    // 发送应用模板成功通知
    if (notificationsEnabled) {
      setTimeout(() => {
        if (Capacitor.isNativePlatform()) {
          PushNotifications.schedule({
            notifications: [
              {
                title: '光效已应用 ✨',
                body: `"${template.name}" 光效已成功应用，开始拍摄吧！`,
                id: new Date().getTime(),
                sound: true,
                attachments: null,
                actionTypeId: '',
                extra: null
              }
            ]
          });
        } else if (Notification && Notification.permission === 'granted') {
          new Notification('光效已应用 ✨', {
            body: `"${template.name}" 光效已成功应用，开始拍摄吧！`
          });
        }
      }, 2000); // 延迟2秒发送通知
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoadingAI(true);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', modelType);
    formData.append('api_key', apiKey);
    
    // 添加用户偏好到请求
    if (userPreference.trim()) {
      formData.append('user_preference', userPreference.trim());
    }

    try {
      const response = await fetch('http://localhost:8000/analyze-image/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const suggestedSettings = await response.json();

      if (suggestedSettings.error) {
        throw new Error(suggestedSettings.error);
      }

      setCustomSettings({
        ...customSettings,
        brightness: parseInt(suggestedSettings.brightness, 10) || 50,
        color: suggestedSettings.color || '#ffffff',
        pattern: suggestedSettings.pattern || 'steady',
      });
      setSelectedTemplate(null);

      const suggestedTemplateName = `AI 推荐 (${file.name.split('.')[0]})`;
      const newTemplate = {
        id: Date.now(),
        name: suggestedTemplateName,
        brightness: parseInt(suggestedSettings.brightness, 10) || 50,
        color: suggestedSettings.color || '#ffffff',
        pattern: suggestedSettings.pattern || 'steady',
      };
      const updatedTemplates = [...savedTemplates, newTemplate];
      setSavedTemplates(updatedTemplates);
      
      // 保存到本地存储
      localStorage.setItem('savedTemplates', JSON.stringify(updatedTemplates));

    } catch (error) {
      console.error("Error uploading or analyzing image:", error);
      setErrorMessage(`AI 分析失败: ${error.message}`);
    } finally {
      setIsLoadingAI(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 w-full h-full transition-all duration-300"
        style={{ 
          backgroundColor: getDisplayColor(),
          opacity: isPulsing ? 0.5 : 1,
          transition: 'background-color 0.3s ease, opacity 0.3s ease'
        }}
      >
        <button 
          className="absolute top-10 left-1/2 transform -translate-x-1/2 ios-pill-button text-sm px-6 py-2"
          onClick={toggleFullscreen}
        >
          返回设置
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white to-white/90 shadow-sm pb-2 backdrop-blur-sm">
        <div className="pt-6 pb-2 px-4">
          <h1 className="text-2xl font-semibold text-center bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">闪亮补光 · 美颜神器</h1>
          
          {errorMessage && (
            <div className="mt-2 p-2 text-sm bg-red-100 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      <div className="px-4">
        {activeTab === 'home' ? (
          // 首页内容
          <>
            {/* 轮盘式颜色选择器 */}
            <div className="mb-8 mt-4">
              <p className="text-xs text-gray-500 mb-3 text-center italic">「一键变身最佳氛围感 · 让你美得不像话」</p>
              
              <div className="relative w-full max-w-sm mx-auto mb-4">
                {/* 不规则方块颜色选择器 */}
                <div className="flex flex-wrap justify-center gap-3 p-4 relative">
                  {colorPresets.map((preset, index) => {
                    const isSelected = selectedTemplate?.id === preset.id;
                    // 为每个方块设置不同的旋转角度和形状
                    const rotation = Math.floor(Math.random() * 8) - 4;
                    const shape = index % 3 === 0 ? 'rounded-xl' : 
                                 index % 3 === 1 ? 'rounded-2xl' : 
                                 'rounded-lg';
                    
                    return (
                      <div 
                        key={preset.id}
                        className={`relative color-block ${shape} shadow-md transition-all duration-300 cursor-pointer overflow-hidden
                                   ${isSelected ? 'scale-110 shadow-lg z-10 ring-2 ring-white' : 'hover:scale-105'}`}
                        style={{ 
                          backgroundColor: preset.color,
                          width: index % 2 === 0 ? '42%' : '38%',
                          height: `${70 + Math.floor(Math.random() * 30)}px`,
                          transform: `rotate(${rotation}deg)`,
                        }}
                        onClick={(e) => {
                          // 立即应用颜色变化
                          handleColorSelect(preset);
                          
                          // 添加点击波纹效果
                          const ripple = document.createElement('div');
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          
                          ripple.style.left = `${x}px`;
                          ripple.style.top = `${y}px`;
                          ripple.className = 'ripple-effect';
                          e.currentTarget.appendChild(ripple);
                          
                          // 移除波纹元素
                          setTimeout(() => {
                            if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
                          }, 600);
                          
                          // 添加选中动画
                          const clickedElement = e.currentTarget;
                          clickedElement.classList.add('color-block-selected');
                          setTimeout(() => {
                            if (clickedElement) clickedElement.classList.remove('color-block-selected');
                          }, 500);
                        }}
                      >
                        {/* 闪亮效果 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        
                        {/* 可爱的装饰元素 */}
                        {index % 2 === 0 && (
                          <div className="absolute top-1 right-1 w-3 h-3 bg-white/30 rounded-full"></div>
                        )}
                        {index % 3 === 1 && (
                          <div className="absolute bottom-1 left-1 w-2 h-2 bg-white/30 rounded-full"></div>
                        )}
                        
                        {/* 颜色名称标签 */}
                        <div className="absolute inset-x-0 bottom-0 bg-black/30 backdrop-blur-sm p-1.5 text-center">
                          <span className="text-xs text-white font-medium" style={{textShadow: '0px 1px 2px rgba(0,0,0,0.5)'}}>
                            {preset.name}
                          </span>
                        </div>
                        
                        {/* 选中效果 */}
                        {isSelected && (
                          <div className="absolute top-1 left-1 bg-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                                className="w-3 h-3" style={{color: preset.color}}>
                              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* 中央颜色显示 */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                    <div 
                      className="w-14 h-14 rounded-full bg-white shadow-lg shadow-white/30 flex items-center justify-center p-1"
                    >
                      <div 
                        className="w-full h-full rounded-full shadow-inner transition-all duration-300" 
                        style={{ backgroundColor: customSettings.color }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* 可爱装饰元素 */}
                  <div className="absolute -top-3 -right-3 w-12 h-12 opacity-20">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.5 12.5C8.5 10.5 11 12 12 13C13 14 14.5 16.5 12.5 18.5C10.5 20.5 8 19 7 18C6 17 4.5 14.5 6.5 12.5Z" fill="#FF9BE3"/>
                      <path d="M18.5 6.5C20.5 8.5 19 11 18 12C17 13 14.5 14.5 12.5 12.5C10.5 10.5 12 8 13 7C14 6 16.5 4.5 18.5 6.5Z" fill="#FF9BE3"/>
                    </svg>
                  </div>
                  
                  <div className="absolute -bottom-4 -left-3 w-10 h-10 opacity-20 transform rotate-45">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" fill="#9EE7FF"/>
                      <path d="M14 9C15.1046 9 16 8.10457 16 7C16 5.89543 15.1046 5 14 5C12.8954 5 12 5.89543 12 7C12 8.10457 12.8954 9 14 9Z" fill="white"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center mt-10">
                <div className="flex items-center justify-center mb-1 bg-white/80 px-4 py-1 rounded-full shadow-sm">
                  <span className="text-sm font-medium mr-2">
                    {selectedTemplate ? selectedTemplate.name : '选择一个颜色'}
                  </span>
                  <div 
                    className="w-5 h-5 rounded-full shadow-inner" 
                    style={{ backgroundColor: customSettings.color }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {selectedTemplate ? selectedTemplate.description : '点击方块选择你喜欢的颜色'}
                </p>
              </div>
            </div>
            
            {/* AI分析相关设置 */}
            <div className="ios-card p-3 mb-4 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    模型类型
                  </label>
                  <input
                    type="text"
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="ios-input text-sm py-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    API 密钥
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="ios-input text-sm py-2 bg-gray-50"
                  />
                </div>
              </div>
              
              {/* 用户偏好描述输入 */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  偏好描述 <span className="text-pink-500 text-[10px]">告诉AI你想要的氛围感~</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={userPreference}
                    onChange={(e) => setUserPreference(e.target.value)}
                    placeholder="例如：温柔氛围感、闺蜜聚会、约会妆容..."
                    className="ios-input text-sm py-2 flex-1 bg-gray-50"
                    ref={preferenceRef}
                  />
                  {userPreference && (
                    <button 
                      className="ml-1 text-gray-500 px-2" 
                      onClick={() => setUserPreference('')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 调整参数区域 - 苹果风格布局 */}
            <div className="ios-card p-3 mb-4 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
              <p className="text-xs text-center text-gray-400 mb-3 italic">「精细调节 · 打造专属于你的完美光效」</p>
              
              {/* 上部分：亮度和饱和度 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-700">光源亮度</span>
                    <span className="text-xs text-gray-500">{customSettings.brightness}%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={customSettings.brightness}
                      onChange={(e) => handleCustomChange('brightness', parseInt(e.target.value))}
                      className="ios-slider"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-700">饱和度</span>
                    <span className="text-xs text-gray-500">{customSettings.saturation}%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={customSettings.saturation}
                      onChange={(e) => handleCustomChange('saturation', parseInt(e.target.value))}
                      className="ios-slider ios-saturation-slider"
                    />
                  </div>
                </div>
              </div>
              
              {/* 屏幕亮度调整 */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">屏幕亮度</span>
                  <span className="text-xs text-gray-500">{customSettings.screenBrightness}%</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customSettings.screenBrightness}
                    onChange={(e) => handleCustomChange('screenBrightness', parseInt(e.target.value))}
                    className="ios-slider"
                  />
                </div>
              </div>
              
              {/* 灯光模式选择 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">灯光模式</span>
                </div>
                <div className="flex justify-between gap-2 p-1 bg-gray-100 rounded-xl">
                  <button 
                    className={`py-1.5 text-center rounded-lg text-xs flex-1 transition ${customSettings.pattern === 'steady' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
                    onClick={() => handleCustomChange('pattern', 'steady')}
                  >
                    常亮
                  </button>
                  <button 
                    className={`py-1.5 text-center rounded-lg text-xs flex-1 transition ${customSettings.pattern === 'pulse' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
                    onClick={() => handleCustomChange('pattern', 'pulse')}
                  >
                    脉冲
                  </button>
                  <button 
                    className={`py-1.5 text-center rounded-lg text-xs flex-1 transition ${customSettings.pattern === 'strobe' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
                    onClick={() => handleCustomChange('pattern', 'strobe')}
                  >
                    频闪
                  </button>
                </div>
              </div>
            </div>
            
            {/* 推送通知设置 */}
            <div className="ios-card p-3 mb-4 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
              <h3 className="text-sm font-medium mb-2">推送通知设置</h3>
              <p className="text-xs text-gray-500 mb-3">开启通知，不错过每一次美颜提醒</p>
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl mb-3">
                <div>
                  <p className="text-sm font-medium">消息通知</p>
                  <p className="text-xs text-gray-500">接收美颜提醒和新功能通知</p>
                </div>
                <div className="ios-switch">
                  <input 
                    type="checkbox" 
                    id="notificationSwitch"
                    checked={notificationsEnabled}
                    onChange={() => {
                      if (Capacitor.isNativePlatform()) {
                        PushNotifications.requestPermissions();
                      } else if (Notification) {
                        Notification.requestPermission();
                      }
                    }}
                    className="hidden" 
                  />
                  <label 
                    htmlFor="notificationSwitch"
                    className={`w-12 h-6 block rounded-full relative cursor-pointer transition-colors ${notificationsEnabled ? 'bg-green-400' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute w-5 h-5 bg-white rounded-full shadow-md top-0.5 left-0.5 transition-transform ${notificationsEnabled ? 'transform translate-x-6' : ''}`}></span>
                  </label>
                </div>
              </div>
              
              <button
                className="ios-pill-button-sm bg-gray-100 w-full py-2 text-sm"
                onClick={sendLocalNotification}
                disabled={!notificationsEnabled}
              >
                发送测试通知
              </button>
            </div>
            
            {/* 功能按钮 - 苹果风格按钮 */}
            <div className="flex flex-col gap-2 mb-4">
              <button
                className="ios-pill-button bg-gradient-to-r from-pink-400 to-pink-500 w-full py-2.5 text-sm flex items-center justify-center"
                onClick={toggleFullscreen}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                </svg>
                开启美肤补光
              </button>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
                id="imageUploadInput"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoadingAI}
                className="ios-pill-button bg-gradient-to-r from-purple-400 to-indigo-500 w-full py-2.5 text-sm flex items-center justify-center"
              >
                {isLoadingAI ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    分析中...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    AI 分析场景 · 一键美颜
                  </>
                )}
              </button>
              
              <button
                className="ios-pill-button bg-gradient-to-r from-green-400 to-teal-500 w-full py-2.5 text-sm flex items-center justify-center"
                onClick={() => setShowSaveTemplateModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                保存我的专属光效
              </button>
            </div>
          </>
        ) : (
          // 我的模板页面
          <div className="mb-20">
            <div className="ios-card p-3 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
              <h2 className="text-base font-medium mb-2 text-center">我的专属灯光</h2>
              <p className="text-xs text-center text-gray-400 mb-3 italic">「留住每一刻的完美光效 · 随时开启闪亮瞬间」</p>
              
              {savedTemplates.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-1">暂无保存的模板</p>
                  <p className="text-gray-400 text-xs">保存你的专属光效，随时一键开启</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedTemplates.map(template => (
                    <div key={template.id} className="flex items-center p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full mr-3 shadow-inner" style={{ backgroundColor: template.color }}></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-[10px] text-gray-500 flex gap-3">
                          <span>亮度: {template.brightness}%</span>
                          <span>模式: {
                            template.pattern === 'steady' ? '常亮' : 
                            template.pattern === 'pulse' ? '脉冲' : 
                            '频闪'
                          }</span>
                        </div>
                      </div>
                      <div className="flex">
                        <button
                          onClick={() => applyTemplate(template)}
                          className="ios-button-sm bg-blue-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center mr-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="ios-button-sm bg-gray-200 text-gray-700 text-xs rounded-full w-7 h-7 flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-gray-100 z-50 backdrop-blur-sm shadow-lg">
        <div className="flex justify-around">
          <button 
            className={`flex flex-col items-center py-3 px-6 ${activeTab === 'home' ? 'text-pink-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('home')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === 'home' ? 2 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">补光</span>
          </button>
          <button 
            className={`flex flex-col items-center py-3 px-6 ${activeTab === 'templates' ? 'text-pink-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('templates')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === 'templates' ? 2 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs mt-1 font-medium">灯光库</span>
          </button>
        </div>
      </div>

      {/* 保存模板模态框 */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="ios-modal p-4 max-w-md w-full rounded-3xl">
            <h3 className="text-lg font-medium mb-2 text-center">保存专属光效</h3>
            <p className="text-xs text-center text-gray-500 mb-4">给你的光效取个好听的名字吧~</p>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="例如: 日杂感、闺蜜聚会光效..."
              className="ios-input mb-4 bg-gray-50 rounded-xl"
            />
            <div className="flex justify-center gap-3">
              <button
                className="ios-pill-button-sm border border-gray-200 bg-gray-50 text-gray-700 px-5 py-2 text-sm"
                onClick={() => setShowSaveTemplateModal(false)}
              >
                取消
              </button>
              <button
                className="ios-pill-button-sm bg-gradient-to-r from-pink-400 to-pink-500 px-5 py-2 text-sm"
                onClick={saveTemplate}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
