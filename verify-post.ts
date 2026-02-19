import { supabase } from './src/services/supabaseClient';

async function verifyPost() {
    console.log('Searching for post...');

    // Search in news
    const { data: news, error: newsError } = await supabase
        .from('cbn_app_news')
        .select('*')
        .ilike('content', '%very unfortunate news%');

    if (newsError) console.error('News Error:', newsError);

    // Search in announcements
    const { data: announcements, error: annError } = await supabase
        .from('cbn_app_announcements')
        .select('*')
        .ilike('content', '%very unfortunate news%');

    if (annError) console.error('Announcement Error:', annError);

    const allPosts = [...(news || []), ...(announcements || [])];

    if (allPosts.length === 0) {
        console.log('No post found with that text.');
        return;
    }

    console.log(`Found ${allPosts.length} post(s):`);
    allPosts.forEach(post => {
        console.log('-----------------------------------');
        console.log('ID:', post.id);
        console.log('Content Preview:', post.content.substring(0, 50) + '...');
        console.log('Image URL:', post.image_url);
        console.log('Video URL:', post.video_url);

        if (post.image_url) checkUrl(post.image_url, 'Image');
        if (post.video_url) checkUrl(post.video_url, 'Video');
    });
}

async function checkUrl(url: string, type: 'Image' | 'Video') {
    if (!url) return;
    try {
        const response = await fetch(url, { method: 'HEAD' });
        console.log(`${type} URL Check: ${response.status} ${response.statusText} (${url})`);
        if (response.status !== 200) {
            console.warn(`⚠️  BROKEN ${type.toUpperCase()} LINK!`);
        } else {
            const contentType = response.headers.get('content-type');
            console.log(`   Content-Type: ${contentType}`);
            const contentLength = response.headers.get('content-length');
            console.log(`   Content-Length: ${contentLength} bytes`);
        }
    } catch (e) {
        console.error(`${type} URL Check Failed:`, e);
    }
}

verifyPost();
