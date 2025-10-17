

//Random Encr String Generator
function generateRandomString() {
    let randomString = "";
    const randomNumber = Math.floor(Math.random() * 10);

    for (let i = 0; i < 20 + randomNumber; i++) {
      randomString += String.fromCharCode(
        33 + Math.floor(Math.random() * 94)
      );
    }

    return randomString;
  }


  //Onload try to auth user, if it fails reauth the user
  window.onload = async () => {
    const fragment = new URLSearchParams(
      window.location.search.slice(1)
    );

    //Get URL Params
    const [code, state] = [
      fragment.get("code"),
      fragment.get("state"),
    ];


    //Add Users String as State to the URI
    if (!code) {
      const randomString = generateRandomString();
      localStorage.setItem("oauth-state", randomString);

      document.getElementById("login").href += `&state=${encodeURIComponent(
        window.btoa(randomString)
      )}`;
      return (document.getElementById("login").style.display = "block");
    }

    //Check if User may has been clickjacked
    if (
      localStorage.getItem("oauth-state") !==
      window.atob(decodeURIComponent(state))
    ) {
      (document.getElementById("login").style.display = "block")
      console.log(localStorage.getItem("oauth-state"))
      console.log("You may have been click-jacked!");

    }

    //Try to auth User
    fetch("http://localhost:53134/auth?code=" + code)
      .then((result) => result.json())
      .then((response) => {
        console.log(response);
        if (response.status == "401") {
          //Authentication Failed --> Try to reauth the User
          try {
            let token = localStorage.getItem("refresh_token");
            fetch("http://localhost:53134/refresh?code=" + token)
              .then((result) => result.json())
              .then((response) => {
                localStorage.setItem(
                  "refresh_token",
                  response.oauth.refresh_token
                );
                if(!response.user) {
                  return (document.getElementById("login").style.display = "block");
                }
                const {username, discriminator} = response.user;
                document.getElementById(
                  "info"
                ).innerText += ` ${username}#${discriminator}`;
                document.getElementById("login").style.display = "none"
              });
          } catch (e) {}
          return
        }
        localStorage.setItem("refresh_token", response.oauth.refresh_token);
        const {username, discriminator} = response.user;
        document.getElementById(
          "info"
        ).innerText += ` ${username}#${discriminator}`;
        document.getElementById("login").style.display = "none"
      })
      .catch(console.error);
  };