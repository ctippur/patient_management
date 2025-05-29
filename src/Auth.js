// Replace this with your actual configuration
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_g4yT4XpfB",
      userPoolClientId: "2oc318oq8294bj5h3jvnpj8u30",
      identityPoolId: "us-east-1:01a46d83-a90c-45f9-919c-3175b3f06d36",
      loginWith: {
        oauth: {
          domain: "patient-management.auth.us-east-1.amazoncognito.com",
          scopes: ["email", "openid", "profile"],
          redirectSignIn: ["http://localhost:3000/callback/"],
          redirectSignOut: ["http://localhost:3000/signout/"],
          responseType: "code",
        },
        username: true,
      },
    },
  },
};


const { Amplify, Auth } = window.aws_amplify;

Amplify.configure(amplifyConfig);

async function signInWithHostedUI() {
  try {
    await Auth.signInWithRedirect();
  } catch (error) {
    console.error("Sign-in error:", error);
  }
}

async function signOut() {
  try {
    await Auth.signOut();
  } catch (error) {
    console.error("Sign-out error:", error);
  }
}

// Check current user and update UI
Auth.getCurrentUser()
  .then(user => {
    document.getElementById("status").innerText = `Status: Signed in as ${user.username}`;
  })
  .catch(() => {
    document.getElementById("status").innerText = "Status: Not signed in";
  });