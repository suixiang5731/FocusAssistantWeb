import { WebDavConfig } from '../types';
import { BackupData, parseAndValidateBackup } from './backup';

export interface WebDavPreset {
  name: string;
  url: string;
  helpText: string;
}

export const WEBDAV_PRESETS: WebDavPreset[] = [
  {
    name: '坚果云 (Jianguoyun)',
    url: 'https://dav.jianguoyun.com/dav/',
    helpText: '需在坚果云[账户信息]->[安全选项]中创建"第三方应用授权密码"',
  },
  {
    name: 'InfiniCLOUD (Teracloud)',
    url: 'https://v2.teracloud.jp/dav/',
    helpText: '在 InfiniCLOUD 账号设置页面开启 WebDAV 并使用专属 App Password',
  },
  {
    name: 'Nextcloud / Owncloud',
    url: 'https://your-domain.com/remote.php/dav/files/YOUR_USER/',
    helpText: '在个人设置 -> 安全 -> 创建新的应用密码',
  },
  {
    name: '自定义 WebDAV 服务器',
    url: '',
    helpText: '支持任何符合标准 WebDAV 协议的网盘或私有部署云存储',
  },
];

export function normalizeWebDavUrl(serverUrl: string, remotePath: string): string {
  let base = serverUrl.trim();
  if (!base) return '';
  if (!base.endsWith('/')) {
    base += '/';
  }

  let path = remotePath.trim();
  if (path.startsWith('/')) {
    path = path.slice(1);
  }

  return base + path;
}

export function getAuthHeader(config: WebDavConfig): string {
  const credentials = `${config.username.trim()}:${config.password.trim()}`;
  return 'Basic ' + btoa(unescape(encodeURIComponent(credentials)));
}

/**
 * Test connection to WebDAV server
 */
export async function testWebDavConnection(config: WebDavConfig): Promise<{ success: boolean; message: string }> {
  if (!config.serverUrl || !config.username || !config.password) {
    return { success: false, message: '请填写完整服务器地址、用户名及密码' };
  }

  const fullUrl = normalizeWebDavUrl(config.serverUrl, config.remotePath || '/focus_flow_backup.json');

  try {
    // Try PROPFIND first, fallback to GET/HEAD
    const authHeader = getAuthHeader(config);
    
    let res = await fetch(fullUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': authHeader,
        'Depth': '0',
      },
    }).catch(() => null);

    // If PROPFIND fails or is unsupported/blocked, try HEAD
    if (!res || !res.ok) {
      res = await fetch(fullUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': authHeader,
        },
      });
    }

    if (res.status === 200 || res.status === 207 || res.status === 404) {
      // 404 means server reached and authenticated, but backup file isn't uploaded yet
      return { success: true, message: 'WebDAV 服务器连接成功！' };
    }

    if (res.status === 401) {
      return { success: false, message: '认证失败 (HTTP 401)：请检查账号与应用授权密码' };
    }

    if (res.status === 403) {
      return { success: false, message: '权限不足 (HTTP 403)：请检查 WebDAV 路径访问权限' };
    }

    return { success: false, message: `服务器返回状态码 HTTP ${res.status}` };
  } catch (err: any) {
    if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
      return {
        success: false,
        message: '连接失败：可能为网络超时、网址格式错误或 WebDAV 服务器跨域(CORS)限制',
      };
    }
    return { success: false, message: `连接异常: ${err?.message || '未知错误'}` };
  }
}

/**
 * Upload backup data to WebDAV server
 */
export async function uploadToWebDav(
  config: WebDavConfig,
  backupData: BackupData
): Promise<{ success: boolean; message: string; timestamp?: number }> {
  if (!config.serverUrl || !config.username || !config.password) {
    return { success: false, message: '请先配置完整的 WebDAV 账号参数' };
  }

  const fullUrl = normalizeWebDavUrl(config.serverUrl, config.remotePath || '/focus_flow_backup.json');
  const authHeader = getAuthHeader(config);
  const jsonContent = JSON.stringify(backupData, null, 2);

  try {
    const res = await fetch(fullUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: jsonContent,
    });

    if (res.ok || res.status === 200 || res.status === 201 || res.status === 204) {
      const now = Date.now();
      return { success: true, message: '数据已成功同步上传至 WebDAV 云端！', timestamp: now };
    }

    if (res.status === 401) {
      return { success: false, message: '上传失败：WebDAV 认证失败 (HTTP 401)' };
    }

    if (res.status === 409) {
      return { success: false, message: '上传失败：云端目录结构不存在 (HTTP 409)' };
    }

    return { success: false, message: `云端同步失败 (HTTP ${res.status})` };
  } catch (err: any) {
    return { success: false, message: `网络或跨域传输异常: ${err?.message || '请检查网络'}` };
  }
}

/**
 * Download backup data from WebDAV server
 */
export async function downloadFromWebDav(
  config: WebDavConfig
): Promise<{ success: boolean; data?: BackupData; message: string }> {
  if (!config.serverUrl || !config.username || !config.password) {
    return { success: false, message: '请先配置完整的 WebDAV 账号参数' };
  }

  const fullUrl = normalizeWebDavUrl(config.serverUrl, config.remotePath || '/focus_flow_backup.json');
  const authHeader = getAuthHeader(config);

  try {
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Cache-Control': 'no-cache',
      },
    });

    if (res.status === 404) {
      return { success: false, message: '未在云端找到备份文件，请先点击“同步上传”进行首次备份' };
    }

    if (res.status === 401) {
      return { success: false, message: '拉取失败：WebDAV 账号或密码错误 (HTTP 401)' };
    }

    if (!res.ok) {
      return { success: false, message: `云端拉取失败 (HTTP ${res.status})` };
    }

    const text = await res.text();
    const validation = parseAndValidateBackup(text);

    if (validation.success && validation.data) {
      return {
        success: true,
        data: validation.data,
        message: `成功拉取云端数据 (导出时间: ${new Date(validation.data.exportedAt).toLocaleString()})`,
      };
    } else {
      return { success: false, message: validation.error || '云端文件解析失败，并非合法的备份格式' };
    }
  } catch (err: any) {
    return { success: false, message: `拉取过程网络异常: ${err?.message || '请检查网络或 CORS 限制'}` };
  }
}
