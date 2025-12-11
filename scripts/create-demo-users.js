const API_URL = 'http://localhost:3000/api/auth/register';

async function register(user) {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const data = await res.json();
        if (res.ok) console.log(`✅ Created ${user.role}: ${user.email}`);
        else console.log(`⚠️  ${user.role}: ${data.message}`);
    } catch (e) {
        console.log(`❌ Error connecting to API: ${e.message}`);
    }
}

const hr = {
    email: 'hr@demo.com',
    password: 'DemoUser123',
    confirmPassword: 'DemoUser123',
    role: 'HR',
    firstName: 'Admin',
    lastName: 'User',
    organizationName: 'Demo Corp'
};

const student = {
    email: 'student@demo.com',
    password: 'DemoUser123',
    confirmPassword: 'DemoUser123',
    role: 'STUDENT',
    firstName: 'Jane',
    lastName: 'Doe'
};

(async () => {
    // Wait a bit for server to be ready if just started
    setTimeout(async () => {
        console.log("Seeding Demo Users...");
        await register(hr);
        await register(student);
    }, 1000);
})();
