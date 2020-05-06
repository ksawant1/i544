<!DOCTYPE html>
<html>
<head>
    <title>Users List</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
<h1>Users List</h1>
<p class="error">{{msg}}</p>

    <table>

        <tr>
            <th> User Id</th>
            <th>Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Creation Date</th>
            <th>Update Date</th>
        </tr>
        {{#users}}
        <tr>
            <td>{{id}}</td>
            <td>{{firstName}} {{lastName}}</td>
            <td>{{email}}</td>
            <td>{{roles}}</td>
            <td>{{creationTime}}</td>
            <td>{{updateTime}}</td>
        </tr>
{{/users}}
    </table>
<div class="scroll">
    {{#prev_cond}}
        <a href='/users?_index={{prev}}' rel="prev"> << </a>
    {{/prev_cond}}
    {{^prev_cond}}

    {{/prev_cond}}

    {{#next_cond}}
    <a href='/users?_index={{next}}' rel="next"> >> </a>
    {{/next_cond}}
    {{^next_cond}}
        {{/next_cond}}

</div>

<footer>
<ul>

    <li> <a href="/users"> List Users</a></li>
    <li> <a href="/search/users"> search Users</a></li>

</ul>
</footer>
</body>
</html>
