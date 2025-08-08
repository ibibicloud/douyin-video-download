
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const urlParams = new URL(request.url).searchParams;
  const shortUrl = urlParams.get('url');

  // 校验参数
  if (!shortUrl) {
    return new Response('请提供短网址参数（?url=xxx）', { status: 400 });
  }

  // 模拟iPhone 14的请求头配置
  const iphone14Headers = {
    // iPhone 14的标准User-Agent（iOS 16.0+，Safari浏览器）
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    // 可选：添加其他设备相关头信息，增强模拟真实性
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9', // 模拟中文语言偏好
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1' // 指示客户端优先使用HTTPS
  };

  try {
    // 发起请求时携带iPhone 14的头信息
    const response = await fetch(shortUrl, {
      redirect: 'follow',
      cf: {
        cacheTtl: 300,
        // 可选：Cloudflare地理位置模拟（如需要模拟iPhone 14常用地区）
        // country: 'US' // 例如模拟美国地区的请求
      },
      headers: iphone14Headers
    });

    if (!response.ok) {
      return new Response(`目标页面请求失败，状态码：${response.status}`, { status: 500 });
    }

    // 获取移动端网页源代码
    const sourceCode = await response.text();
    // 正则匹配 title
    const title = await sourceCode.match(/<title>(.*?) - 抖音<\/title>/);
    // 正则匹配 video_id
    const video_id = await sourceCode.match(/video_id=(.*?)["&]/);

    return new Response(
      JSON.stringify({
        redirectUrl: response.url,
        // title: title[1] || '',
        title: title,
        // video_id: video_id[1] || '',
        video_id: video_id,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    return new Response(`处理失败：${error.message}`, { status: 500 });
  }
}