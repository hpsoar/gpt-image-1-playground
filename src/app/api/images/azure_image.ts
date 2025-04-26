import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// 定义环境变量类型
interface Env {
    AZURE_API_KEY: string;
    AZURE_BASE_URL: string;
}


interface ImageGeneration {
  b64_json?: string;
  url?: string;
  revised_prompt?: string; // DALL-E 3特有字段[5](@ref)
}


// 定义API响应结构
interface ApiResponse {
    data: ImageGeneration[];
    error?: {
        message: string;
    };
}

// 图片生成参数
interface GenerateImageParams {
    prompt: string;
    size?: '1024x1024' | '1024x1792' | '1792x1024';
    quality?: 'standard' | 'hd';
    n?: number;
}

// 环境变量配置（建议使用dotenv或直接在运行环境配置）
const env: Env = {
    AZURE_API_KEY: process.env.AZURE_API_KEY || '',
    AZURE_BASE_URL: process.env.AZURE_BASE_URL || '',
};

// Azure OpenAI配置
const azureConfig = {
    deployment: 'gpt-image-1',
    apiVersion: '2025-04-01-preview'
};

// 生成图片函数
async function generateImage(params: GenerateImageParams): Promise<ImageGeneration[]> {
    try {
        const url = `${env.AZURE_BASE_URL}/openai/deployments/${azureConfig.deployment}/images/generations?api-version=${azureConfig.apiVersion}`;
        
        const apiData = {
            prompt: params.prompt,
            size: '1024x1024',
            quality: 'medium',
            n: 1
        }

        console.log('Calling OpenAI generate with params:', url);
        console.log('Calling OpenAI generate with params:', env.AZURE_API_KEY);
        console.log('Calling OpenAI generate with params:', apiData);
        
        const response = await axios.post<ApiResponse>(url,  apiData, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': env.AZURE_API_KEY
            }
        });

        if (response.data.error) {
            throw new Error(`API Error: ${response.data.error.message}`);
        }

        const b64Data = response.data.data[0].b64_json;
        if (!b64Data) {
            throw new Error('No image data received');
        }

        // 使用 path.join 处理特殊字符和跨平台路径
        const targetDir = path.join(
          process.cwd(), 
          'src/app/api/images', 
          'azure_image.ts [app-route] (ecmascript)'
        );
        const outputPath = path.join(targetDir, 'generated_image.png');

        // 创建目录（递归创建缺失的父目录）
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true }); // [6,9](@ref)
        }

        // 解码并保存图片
        const buffer = Buffer.from(b64Data, 'base64');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`Image saved to: ${outputPath}`);

        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error generating image:', error.message);
        } else {
            console.error('Unknown error occurred:', error);
        }
        return undefined;
    }
}

export default generateImage
