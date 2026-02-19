const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwiovokagddmcmwkrejy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aW92b2thZ2RkbWNtd2tyZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjYwMzIsImV4cCI6MjA4MzgwMjAzMn0.smuWrLqMVfiLNF-5ebobTbvqzVeHTB5yo67gjvL4Dmc';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    for (const post of allPosts) {
        console.log('-----------------------------------');
        console.log('ID:', post.id);
        console.log('Content Preview:', post.content.substring(0, 50) + '...');
        console.log('Image URL:', post.image_url);
        console.log('Video URL:', post.video_url);

        if (post.image_url) await checkUrl(post.image_url, 'Image');
        if (post.video_url) await checkUrl(post.video_url, 'Video');
    }
}

async function checkUrl(url, type) {
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
