

const http = require('http');

function postReq(path, data) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve(body));
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    try {
        console.log("Signup:", await postReq('/signup', { username: "test", email: "test@test.com", password: "123" }));
        console.log("Login:", await postReq('/login', { email: "test@test.com", password: "123" }));
        console.log("Crime:", await postReq('/crime', { city: "New York", year: "2024" }));
    } catch(err) {
        console.error(err);
    }
}
run();
