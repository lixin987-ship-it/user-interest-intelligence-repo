// GPT API调用功能模块

// 调用GPT模型
async function callGPTModels(prompt, model) {
    try {
        console.log(`正在调用模型: ${model}`);
        
        // 获取API配置
        const config = await getAPIConfig(model);
        console.log('API配置获取成功');
        
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': config.apiKey
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: parseInt(config.maxTokens) || 4000,
                temperature: 0.7
            })
        });

        console.log('API响应状态:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API调用失败: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        console.log('API响应数据:', data);
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content;
            try {
                // 尝试直接解析JSON
                return JSON.parse(content);
            } catch (e) {
                // 如果返回不是JSON，尝试提取JSON部分
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                // 如果都失败了，返回原始内容
                return {
                    "error": "API返回格式不是JSON",
                    "raw_content": content
                };
            }
        } else {
            throw new Error('API返回数据格式错误');
        }
    } catch (error) {
        console.error('GPT API调用错误:', error);
        throw error;
    }
}

// 获取API配置
async function getAPIConfig(model) {
    try {
        console.log('正在获取API配置...');
        const response = await fetch('resources/key.txt');
        if (!response.ok) {
            throw new Error(`无法读取配置文件: ${response.status}`);
        }
        
        const encryptedData = await response.text();
        console.log('配置文件读取成功');
        
        // 解密配置数据
        const decryptedData = decryptConfig(encryptedData);
        const configs = parseConfigs(decryptedData);
        
        console.log('可用的模型配置:', Object.keys(configs));
        
        if (!configs[model]) {
            throw new Error(`未找到模型 ${model} 的配置。可用模型: ${Object.keys(configs).join(', ')}`);
        }
        
        return configs[model];
    } catch (error) {
        console.error('获取API配置失败:', error);
        throw new Error(`获取API配置失败: ${error.message}`);
    }
}

// 解密配置数据
function decryptConfig(encryptedData) {
    try {
        console.log('开始解密配置...');
        // 移除注释和空行
        const cleanData = encryptedData
            .split('\n')
            .filter(line => !line.startsWith('#') && line.trim())
            .join('');
        
        console.log('清理后的数据长度:', cleanData.length);
        
        // Base64解码
        const base64Decoded = atob(cleanData);
        console.log('Base64解码完成');
        
        // 字符偏移解密（偏移-3）
        let decrypted = '';
        for (let i = 0; i < base64Decoded.length; i++) {
            decrypted += String.fromCharCode(base64Decoded.charCodeAt(i) - 3);
        }
        
        console.log('解密完成，数据长度:', decrypted.length);
        return decrypted;
    } catch (error) {
        console.error('配置解密失败:', error);
        throw new Error(`配置解密失败: ${error.message}`);
    }
}

// 解析配置数据
function parseConfigs(configText) {
    try {
        console.log('开始解析配置文件...');
        const configs = {};
        const sections = configText.split('[model:').slice(1);
        
        console.log('找到配置段数:', sections.length);
        
        sections.forEach((section, index) => {
            console.log(`解析第${index + 1}个配置段...`);
            const lines = section.split('\n');
            const modelName = lines[0].replace(']', '').trim();
            
            console.log(`模型名称: ${modelName}`);
            
            const config = {};
            lines.slice(1).forEach(line => {
                if (line.includes('=')) {
                    const [key, value] = line.split('=').map(s => s.trim());
                    if (key && value) {
                        config[key] = value;
                        console.log(`  ${key}: ${value.substring(0, 20)}...`);
                    }
                }
            });
            
            if (config.endpoint && config.apiKey) {
                configs[modelName] = config;
                console.log(`模型 ${modelName} 配置解析成功`);
            } else {
                console.warn(`模型 ${modelName} 配置不完整，跳过`);
            }
        });
        
        console.log('配置解析完成，可用模型:', Object.keys(configs));
        return configs;
    } catch (error) {
        console.error('配置解析失败:', error);
        throw new Error(`配置解析失败: ${error.message}`);
    }
}