
// 处理GET请求：通过url参数传递短网址，如 /api/fetch-source?url=https://短网址
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const urlParams = new URL(request.url).searchParams;
  const shortUrl = urlParams.get('url');

  // 校验参数
  if (!shortUrl) {
    return new Response('请提供短网址参数（?url=xxx）', { status: 400 });
  }

  try {
    // Cloudflare的fetch默认自动跟随重定向（最多5次）
    const response = await fetch(shortUrl, {
      redirect: 'follow',  // 显式指定跟随重定向（默认就是follow）
      cf: {
        // 可选：配置Cloudflare边缘优化（如缓存、地区等）
        cacheTtl: 300,  // 缓存结果5分钟（减少重复请求）
      }
    });

    // 确认请求成功
    if (!response.ok) {
      return new Response(`目标页面请求失败，状态码：${response.status}`, { status: 500 });
    }

    // 获取最终页面的HTML源码
    const sourceCode = await response.text();

    // 返回结果（包含重定向后的URL和源码）
    return new Response(
      JSON.stringify({
        redirectUrl: response.url,  // 重定向后的最终URL
        sourceCode: sourceCode      // 页面源码
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'  // 允许跨域（如需前端调用）
        }
      }
    );

  } catch (error) {
    return new Response(`处理失败：${error.message}`, { status: 500 });
  }
}