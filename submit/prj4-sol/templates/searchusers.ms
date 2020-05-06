<html>
<head>
    <title>User Search</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
<h1>Users Search</h1>
<ul>
    {{#errors}}
        <li class="error">{{.}}</li>
    {{/errors}}
</ul>
<p id="demo1">
    Please fill in one or more of the following fields

</p>
<form method="GET" action="/search/users">

    <label for="userId">User ID</label>
    <div>
        <input type="text" name="id" id="userId" value="{{value}}">
        <p style="color:red;font-size:11px;" id="demo"></p>

        <div class="error" id="userIdErr"></div>

    </div>
    <label for="email">User Email</label>
    <div>
        <input name="email" id="email"  type="email" value="{{value}}">
{{#errorMessage}} <div class="error"></div>{{/errorMessage}}
    </div>
    <label for="firstName">First Name</label>
    <div>
        <input name="firstName" id="firstName" value="{{value}}">
        <div class="error"></div>
    </div>
    <label for="lastName">Last Name</label>
    <div>
        <input name="lastName" id="lastName" value="{{value}}">
        <div class="error"></div>
    </div>
    <label for="creationTime">ISO Creation Time</label>
    <div>
        <input name="creationTime" id="creationTime" type="date" value="{{value}}">
        <div class="error"></div>
    </div>



    &nbsp;<input name="submit" type="submit" value="search" class="control">
    </div>
</form>

<footer>
    <ul>
        <li><a href="/users">List Users</a></li>
        <li><a href="/search/users">Search Users</a></li>
    </ul>
</footer>
<script>
    (
           function myFunction(){

        document.getElementById("userId").addEventListener("blur", async function() {
            const data=document.getElementById("userId").value;

            const URL = `/users/${data}`;
            fetch(URL)
                    .then(response => response.json())
                    .then(json => {
                        if(json.length===0)
                            document.getElementById("demo").innerHTML =`There is no user with id ${data}`;
                        else
                            document.getElementById("demo").innerHTML ="";

                    });


        })
           }
        )();





</script>
<script src="./blog544-ss.mjs"></script>

</body>
</html>
