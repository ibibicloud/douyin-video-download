
export async function onRequestGet(context) {
    const { request, env, params } = context;
    const urlParams = new URL(request.url).searchParams;
    const shortUrl = urlParams.get('url');

    // 定义统一响应
    const HttpResponse = (success, message, data, status) => {
        return new Response(
            JSON.stringify({
                success: success == 'success' ? true : false,
                message,
                data,
            }),
            {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                },
                status
            }
        );
    }

    // 校验参数
    if ( !shortUrl ) {
        return HttpResponse('fail', '请提供短网址参数（?url=xxx）', {}, 400);
    }

    // 模拟iPhone 14的请求头配置
    const iphone14Headers = {
        // iPhone 14的标准User-Agent（iOS 16.0+，Safari浏览器）
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        // 可选：添加其他设备相关头信息，增强模拟真实性
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        // 模拟中文语言偏好
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Connection': 'keep-alive',
        // 指示客户端优先使用HTTPS
        'Upgrade-Insecure-Requests': '1'
    };

    try {
        // 发起请求时携带iPhone 14的头信息
        const response = await fetch(shortUrl, {
            redirect: 'follow',
            cf: {
                // 相同的短链接请求在N秒内会直接返回缓存结果，减少重复请求 单位：秒
                cacheTtl: 300,
                // 可选：Cloudflare地理位置模拟（如需要模拟iPhone 14常用地区）
                // country: 'US' // 例如模拟美国地区的请求
            },
            headers: iphone14Headers
        });

        if ( !response.ok ) {
            return HttpResponse('fail', `目标页面请求失败，状态码：${response.status}`, {}, 500);
        }

        const sourceCode = await response.text();
        const loaderDataString = await sourceCode.match(/window._ROUTER_DATA = (.*?)<\/script>/);

        if ( !loaderDataString[1] ) {
            return HttpResponse('fail', '网页源代码正则匹配失败', {}, 400);
        }

        let loaderData = JSON.parse(loaderDataString[1]);
        loaderData = loaderData.loaderData;
        loaderData = {
            isSpider: loaderData.data["video_(id)/page"],
            // isSpider: loaderData.data['video_(id)/page'].isSpider,
            // aweme_id: loaderData.data['video_(id)/page'].videoInfoRes.item_list[0].aweme_id,
            // desc: loaderData.data['video_(id)/page'].videoInfoRes.item_list[0].desc,
            // create_time: loaderData.data['video_(id)/page'].videoInfoRes.item_list[0].create_time,
        };

        return HttpResponse('success', '处理成功', loaderData, 200);
    } catch (error) {
        return HttpResponse('fail', `处理失败：${error.message}`, {}, 500);
    }
}