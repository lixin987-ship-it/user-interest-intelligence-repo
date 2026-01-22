// 临时修复脚本
// 修复所有JavaScript错误

// 1. 安全的元素访问函数
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`元素 ${id} 不存在`);
    }
    return element;
}

// 2. 安全的事件监听器添加
function safeAddEventListener(elementId, event, handler) {
    const element = safeGetElement(elementId);
    if (element) {
        element.addEventListener(event, handler);
        console.log(`成功为 ${elementId} 添加 ${event} 事件监听器`);
    }
}

// 3. 修复的初始化函数
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面DOM加载完成 - 修复版本');
    
    // 用户选择变化
    safeAddEventListener('userSelect', 'change', function() {
        console.log('用户选择变化:', this.value);
        const getUserBtn = safeGetElement('getUserBehaviorBtn');
        if (getUserBtn) {
            getUserBtn.disabled = !this.value;
            console.log('按钮状态:', getUserBtn.disabled ? '禁用' : '启用');
        }
    });
    
    // AI模型选择变化
    safeAddEventListener('aiProvider', 'change', function() {
        console.log('AI模型选择变化:', this.value);
        updateRunButton();
    });
    
    // 提示选择变化
    safeAddEventListener('promptSelect', 'change', function() {
        console.log('提示选择变化:', this.value);
        updateRunButton();
        
        const preview = safeGetElement('promptPreview');
        const previewBox = preview ? preview.querySelector('.prompt-preview-box') : null;
        const promptData = safeGetElement('promptData');
        
        if (this.value && window.prompts && window.prompts[this.value]) {
            if (preview) preview.style.display = 'block';
            if (previewBox) previewBox.textContent = window.prompts[this.value];
            if (promptData) promptData.value = window.prompts[this.value];
        } else {
            if (preview) preview.style.display = 'none';
            if (previewBox) previewBox.textContent = '';
            if (promptData) promptData.value = '';
        }
    });
    
    console.log('所有事件监听器已安全设置');
});

// 4. 修复的updateRunButton函数
function updateRunButton() {
    const aiProvider = safeGetElement('aiProvider');
    const promptSelect = safeGetElement('promptSelect');
    const runBtn = safeGetElement('runAnalysisBtn');
    
    if (!aiProvider || !promptSelect || !runBtn) {
        console.log('找不到必要的元素进行按钮状态更新');
        return;
    }
    
    const isReady = promptSelect.value && aiProvider.value;
    runBtn.disabled = !isReady;
    console.log('按钮状态更新:', isReady ? '启用' : '禁用');
}

console.log('修复脚本已加载');