const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function exhaustiveGlobalSearch() {
    try {
        let allFiles = [];
        let pageToken = null;

        do {
            const res = await drive.files.list({
                q: "trashed = false",
                fields: 'nextPageToken, files(id, name, mimeType, parents, owners)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
                pageSize: 1000,
                pageToken: pageToken
            });
            allFiles = allFiles.concat(res.data.files);
            pageToken = res.data.nextPageToken;
        } while (pageToken);

        console.log(`TOTAL ACCESSIBLE FILES: ${allFiles.length}`);

        // Filter for files that look like TOI pages but NOT in the 1-22 list I already found
        const knownIds = new Set([
            '1zaD3MZyk-jxPxNoWWDnmvUOtJFF23Ez8', // 1-1
            '1W2wKJQfQtvMrDcEJJJvjTvz_P8u4LIOz', // 2-1
            '1vyqdxu3I57CxDHZEFG8azuE9NTekFrY8', // 3-1
            '1cZd4ju_RqmQbXXInkHNEdawnAbToP5gj', // 4-1
            '1-yxhmutnthRacbqI7gB-b9h9y3-QQZcI', // 5-1
            '1Q2301N0e0h9Xf2spv1IQHZw9VTzfq5ow', // 6-1
            '1nwJphoDeBudmwFRytcTwLouqrPwvVZ0B', // 7-1
            '1jiYic16am5wyPs6m_xiwwcgBhHJsg9fB', // 8-1
            '1U6qOE8vFRKbJ5rkotOy-tWockZwyqRb7', // 9-1
            '1svAbGJ5V25wDfxGx4XxtFhl4XgiLpeqY', // 10-1
            '1hHGSn06B36bR74KAX7NfIpa1ujgt7EzR', // 11-1
            '10ZECUWHUdAokSGRQFYq0DdBkciYpnodV', // 12-1
            '1YAhJIb_8k55wkApWzakVldj-qk2MVav6', // 13-1
            '1Qr615-cHhIsMEg47v_OESZgCVlHGOE6E', // 14-1
            '1kd9rEgJb-PiBBi2rQKkB5ANG9lOgTviD', // 15-1
            '1_gjEFovE12mEiRqgGhG7VdOHDEHeelKt', // 16-1
            '1SDXgvrNJuh4c6j_yx105IeZRwmh9rUAr', // 17-1
            '1ksIF-zm_IAJeNMgg4poj6g8iOKHn2ACf', // 19-1
            '19Vh3FMipuFTbJ4GI4nOSWhKdUrcPqhgW', // 20-1
            '1ZiVyVDgpFLdyR6I5wR9vyxrFx_X6BmbN', // 21-1
            '1KWTS0U71kKGVU_qaPbMky_FCSgGBYYKd', // 22-1
        ]);

        const interesting = allFiles.filter(f => {
            const name = f.name.toLowerCase();
            return !knownIds.has(f.id) && (
                name.includes('page') ||
                name.includes('toi') ||
                /^\d+.*\.jpg$/.test(name) ||
                name.includes('foam')
            );
        });

        console.log(`FOUND ${interesting.length} INTERESTING FILES:`);
        interesting.forEach(f => {
            console.log(`${f.name} | ${f.id} | ${f.mimeType} | Parents: ${f.parents?.join(',')}`);
        });

    } catch (err) {
        console.error(err);
    }
}

exhaustiveGlobalSearch();
