'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customSettings, setCustomSettings] = useState({
    brightness: 50,
    color: '#ffffff',
    pattern: 'steady'
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isPulsing, setIsPulsing] = useState(false);
  const [isStrobing, setIsStrobing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const templates = [
    { id: 1, name: '人像模式', brightness: 70, color: '#ffffff', pattern: 'steady' },
    { id: 2, name: '夜景模式', brightness: 90, color: '#ffffff', pattern: 'steady' },
    { id: 3, name: '氛围模式', brightness: 40, color: '#ffcc00', pattern: 'pulse' },
    { id: 4, name: '派对模式', brightness: 60, color: '#ff00ff', pattern: 'strobe' }
  ];

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

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setCustomSettings({
      brightness: template.brightness,
      color: template.color,
      pattern: template.pattern
    });
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
      setSavedTemplates(prev => [...prev, newTemplate]);
      setShowSaveTemplateModal(false);
      setNewTemplateName('');
    }
  };

  const deleteTemplate = (id) => {
    setSavedTemplates(prev => prev.filter(template => template.id !== id));
  };

  const getDisplayColor = () => {
    if (customSettings.pattern === 'strobe' && isStrobing) {
      return '#000000';
    }
    const brightness = customSettings.brightness / 100;
    const color = customSettings.color;
    return color;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoadingAI(true);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/analyze-image/', { // Ensure backend runs on port 8000
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

      // Apply suggested settings and potentially save as a new template
      setCustomSettings({
        brightness: parseInt(suggestedSettings.brightness, 10) || 50,
        color: suggestedSettings.color || '#ffffff',
        pattern: suggestedSettings.pattern || 'steady',
      });
      setSelectedTemplate(null); // Deselect any preset template

      // Optional: Automatically save the suggested settings as a template
      const suggestedTemplateName = `AI Suggestion (${file.name.split('.')[0]})`;
      const newTemplate = {
        id: Date.now(),
        name: suggestedTemplateName,
        brightness: parseInt(suggestedSettings.brightness, 10) || 50,
        color: suggestedSettings.color || '#ffffff',
        pattern: suggestedSettings.pattern || 'steady',
      };
      setSavedTemplates(prev => [...prev, newTemplate]);


    } catch (error) {
      console.error("Error uploading or analyzing image:", error);
      setErrorMessage(`Failed to get AI suggestion: ${error.message}`);
    } finally {
      setIsLoadingAI(false);
      // Reset file input to allow uploading the same file again
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
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button 
            className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
            onClick={toggleFullscreen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            返回设置
          </button>
          <button 
            className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
            onClick={() => setShowSaveTemplateModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            保存模板
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 animate-fade-in">智能补光灯</h1>
        
        {/* Error Message Display */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {errorMessage}</span>
          </div>
        )}

        {/* AI Suggestion Button */}
        <div className="mb-8 text-center animate-slide-up">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            ref={fileInputRef}
            style={{ display: 'none' }} // Hide the default input
            id="imageUploadInput"
          />
          <button
            onClick={() => fileInputRef.current?.click()} // Trigger hidden input
            disabled={isLoadingAI}
            className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto gap-2"
          >
            {isLoadingAI ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                 AI 分析场景生成模板
              </>
            )}
          </button>
        </div>

        {/* 预设模板区域 */}
        <div className="mb-8 animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">预设模板</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-medium">{template.name}</div>
                  <div className="text-sm text-gray-600">
                    亮度: {template.brightness}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 保存的模板区域 */}
        {savedTemplates.length > 0 && (
          <div className="mb-8 animate-slide-up">
            <h2 className="text-xl font-semibold mb-4">我的模板</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {savedTemplates.map(template => (
                <div
                  key={template.id}
                  className="p-4 rounded-lg border border-gray-300 bg-white shadow-sm"
                >
                  <div className="text-center">
                    <div className="text-lg font-medium">{template.name}</div>
                    <div className="text-sm text-gray-600">
                      亮度: {template.brightness}%
                    </div>
                    <div className="mt-2 flex justify-center gap-2">
                      <button
                        onClick={() => handleTemplateSelect(template)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        使用
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 自定义设置区域 */}
        <div className="bg-white p-6 rounded-lg shadow-md animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">自定义设置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                亮度: {customSettings.brightness}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={customSettings.brightness}
                onChange={(e) => handleCustomChange('brightness', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                颜色
              </label>
              <input
                type="color"
                value={customSettings.color}
                onChange={(e) => handleCustomChange('color', e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模式
              </label>
              <select
                value={customSettings.pattern}
                onChange={(e) => handleCustomChange('pattern', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="steady">常亮</option>
                <option value="pulse">脉冲</option>
                <option value="strobe">频闪</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300 hover:scale-105"
              onClick={toggleFullscreen}
            >
              全屏显示
            </button>
            <button
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-all duration-300 hover:scale-105"
              onClick={() => setShowSaveTemplateModal(true)}
            >
              保存模板
            </button>
          </div>
        </div>
      </div>

      {/* 保存模板模态框 */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold mb-4">保存模板</h3>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="输入模板名称"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowSaveTemplateModal(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
