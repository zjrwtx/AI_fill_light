'use client';

import { useState, useEffect, useRef } from 'react';

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
  const fileInputRef = useRef(null);

  const colorPresets = [
    { id: 1, name: '女感', color: '#F9DDE0', backgroundColor: '#FFC0CB' },
    { id: 2, name: '唐皮感', color: '#9370DB', backgroundColor: '#9370DB' },
    { id: 3, name: '冷白皮', color: '#B6E3F4', backgroundColor: '#87CEEB' },
    { id: 4, name: '百搭光', color: '#FFFFFF', backgroundColor: '#FFFFFF' },
    { id: 5, name: '小鸡黄', color: '#FFEB3B', backgroundColor: '#FFEB3B' },
    { id: 6, name: '清新光', color: '#90CAF9', backgroundColor: '#2196F3' },
  ];

  // 从localStorage加载保存的模板
  useEffect(() => {
    const storedTemplates = localStorage.getItem('savedTemplates');
    if (storedTemplates) {
      setSavedTemplates(JSON.parse(storedTemplates));
    }
  }, []);

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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoadingAI(true);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', modelType);
    formData.append('api_key', apiKey);

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
          className="absolute top-10 left-1/2 transform -translate-x-1/2 ios-button"
          onClick={toggleFullscreen}
        >
          返回设置
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="pt-12 pb-4">
        <h1 className="text-2xl font-semibold text-center">AI 补光灯</h1>
        
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}
      </div>

      {activeTab === 'home' ? (
        // 首页内容
        <>
          {/* 颜色预设选项 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {colorPresets.map((preset) => (
              <div key={preset.id} className="flex flex-col items-center">
                <button
                  onClick={() => handleColorSelect(preset)}
                  className={`ios-color-button w-full ${selectedTemplate?.id === preset.id ? 'selected' : ''}`}
                  style={{ backgroundColor: preset.backgroundColor }}
                >
                  {preset.name}
                </button>
              </div>
            ))}
          </div>
          
          {/* 模型类型和API密钥输入 */}
          <div className="ios-card p-4 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模型类型
              </label>
              <input
                type="text"
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="ios-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API 密钥
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="ios-input"
              />
            </div>
          </div>
          
          {/* 饱和度调整 */}
          <div className="ios-card p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg">饱和度</span>
              <span className="text-sm text-gray-500"></span>
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
          
          {/* 屏幕亮度调整 */}
          <div className="ios-card p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg">屏幕亮度</span>
              <span className="text-sm text-gray-500"></span>
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
          
          {/* 亮度调整 */}
          <div className="ios-card p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg">光源亮度</span>
              <span className="text-sm text-gray-500">{customSettings.brightness}%</span>
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
          
          {/* 灯光模式选择 */}
          <div className="ios-card p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg">灯光模式</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button 
                className={`p-3 text-center rounded-xl ${customSettings.pattern === 'steady' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => handleCustomChange('pattern', 'steady')}
              >
                常亮
              </button>
              <button 
                className={`p-3 text-center rounded-xl ${customSettings.pattern === 'pulse' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => handleCustomChange('pattern', 'pulse')}
              >
                脉冲
              </button>
              <button 
                className={`p-3 text-center rounded-xl ${customSettings.pattern === 'strobe' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => handleCustomChange('pattern', 'strobe')}
              >
                频闪
              </button>
            </div>
          </div>
          
          {/* 功能按钮 */}
          <div className="flex gap-3 mb-6">
            <button
              className="flex-1 ios-button bg-blue-500"
              onClick={toggleFullscreen}
            >
              开启补光
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
              className="flex-1 ios-button bg-purple-500"
            >
              {isLoadingAI ? "分析中..." : "AI 分析场景"}
            </button>
          </div>
          
          {/* 保存按钮 */}
          <div className="mb-12">
            <button
              className="ios-button bg-green-500 w-full"
              onClick={() => setShowSaveTemplateModal(true)}
            >
              保存当前设置
            </button>
          </div>
        </>
      ) : (
        // 我的模板页面
        <div className="mb-20">
          <div className="ios-card p-4">
            <h2 className="text-lg font-medium mb-4">已保存的模板</h2>
            {savedTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无保存的模板，请先创建模板
              </div>
            ) : (
              <div className="space-y-3">
                {savedTemplates.map(template => (
                  <div key={template.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full mr-3" style={{ backgroundColor: template.color }}></div>
                    <div className="flex-1">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500">亮度: {template.brightness}%</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCustomSettings({
                            brightness: template.brightness,
                            color: template.color,
                            pattern: template.pattern,
                            saturation: customSettings.saturation,
                            screenBrightness: customSettings.screenBrightness
                          });
                          setActiveTab('home');
                        }}
                        className="text-blue-500 px-3 py-1"
                      >
                        使用
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-500 px-3 py-1"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around">
          <button 
            className={`flex flex-col items-center py-3 px-6 ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('home')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">首页</span>
          </button>
          <button 
            className={`flex flex-col items-center py-3 px-6 ${activeTab === 'templates' ? 'text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('templates')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs mt-1">我的模板</span>
          </button>
        </div>
      </div>

      {/* 保存模板模态框 */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="ios-modal p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">保存模板</h3>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="输入模板名称"
              className="ios-input mb-6"
            />
            <div className="flex justify-end gap-4">
              <button
                className="text-blue-500 px-4 py-2"
                onClick={() => setShowSaveTemplateModal(false)}
              >
                取消
              </button>
              <button
                className="ios-button"
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
