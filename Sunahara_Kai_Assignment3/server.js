/*
By Kai Sunahara
*/
var express = require('express'); //require express
var myParser = require("body-parser"); //require body parser
var products = require('./public/product_data'); //load product_data.json
var fs = require('fs'); //Code from Lab 13
var session = require('express-session');
var nodemailer = require(`nodemailer`)
const cookieParser = require('cookie-parser');
var app = express(); //require express
var user_data_filename = `user_data.json`;

//starts parser
app.use(myParser.urlencoded({ extended: true }));
app.use(session({ secret: `FurnitureShop` }))

app.all('*', function (request, response, next) {
    // need to initialize an object to store the cart in the session. We do it when there is any request so that we don't have to check it exists
    // anytime it's used
    if (typeof request.session.cart == 'undefined') { request.session.cart = {}; }
    next();
});

//gets the products information. Saves it as a variable to be used late and sents it to loadjson. (Assignment 3 Example)
app.post("/get_products_data", function (request, response) {
    products_data = products
    response.json(products);
});

//gets the users information and sends it to loadjson(Assignment 3 Example)
app.post("/user_data", function (request, response) {
    response.json(user_reg_data);
});

//adds the specified quantity, saves it, and displays infroamtion regarding how much was put in the cart
app.get("/add_to_cart", function (request, response) {
    var products_key = request.query['products_key']; // get the product key sent from the form post
    var quantities = request.query['quantities'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
    console.log(request.query)
    console.log(quantities)
    for (i in quantities) {
        if (isNonNegInt(quantities[i])) {
            request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
            return response.send(`<script>
            alert("${quantities.reduce((a, b) => a + b, 0)} items from this page are in the cart"); 
            window.history.back(); 
            
            </script>`);
        } else {
            return response.send(`<script>
            alert("You have entered an Invalid Quantity"); 
            window.history.back(); 
            
            </script>`);
        }

    }
});

//specific for when users want to modify products in cart
app.get("/modifyincart", function (request, response) {
    var products_key = request.query['products_key']; // get the product key sent from the form post
    var quantities = request.query['quantities'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
    for (i in quantities) {
        if (isNonNegInt(quantities[i])) {
            request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
            return response.send(`<script>
            alert("${quantities.reduce((a, b) => a + b, 0)} items from this page are in the cart"); 
            window.top.location.reload();          
            </script>`);
        } else {
            return response.send(`<script>
            alert("You have entered an Invalid Quantity"); 
            window.history.back(); 
            
            </script>`);
        }

    }
});

//used to send the corresponding cart information when requested. used to display cart informaiton.(Assignment 3 Example)
app.post("/get_cart", function (request, response) {
    shopping_cart = (request.session.cart)
    response.send(request.session.cart)
});

//Taken from Lab14. Checks to see if user_data.json exists
if (fs.existsSync(user_data_filename)) {
    data = fs.readFileSync(user_data_filename, 'utf-8');
    stats = fs.statSync(user_data_filename)
    var user_reg_data = JSON.parse(data); // Takes a string and converts it into object or array    
    console.log(user_data_filename + ' has ' + stats.size + ' characters');

    console.log(user_reg_data);//Displays register users in user_data.json
} else {
    console.log(user_data_filename + ' does not exist!');//Displays warning if user_data.json is missing
}

app.use(cookieParser());

//The POST request will be redirected to either the invoice or be given a page to retry login/register new account. Partically taken from Lab 14
app.post("/loginform", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    console.log(request.body);
    username = request.body.username.toLowerCase();//will recieve username in lowercase ONLY
    if (typeof user_reg_data[username] != 'undefined') {
        //if username exists, get password 
        if ((user_reg_data[username].password == request.body.password) == true) {
            console.log(username + ' logged in');
            fullname = user_reg_data[username].name;
            response.cookie(`username`, username, {maxAge: 300000});
            response.redirect(`./index.html`)
        } else {
            response.send(`<script>
            alert("The password that you have entered is not correct."); 
            window.history.back(); 
            
            </script>`);
        }
    } else {
        //Option to go back and retry login, or register a new account
        response.send(`<script>
        alert("The username you have entered does not match our records."); 
        window.history.back(); 
        
        </script>`);
    }

});


//The GET /register is taken from register.html
app.get("/register", function (request, response) {
    response.redirect(`./register.html`); // render template string
});
//When the POST /register is recieved it will begin the process to register new account
app.post("/register", function (request, response) {
    var username = request.body.username;//Assigns username to variable
    var password = request.body.password;//Assigns password to variable
    var second_password = request.body.secondpassword;//Assigns second password to variable
    var email = request.body.email.toLowerCase();//Assigns email to variable and converts to only lowercase
    var fullname = request.body.fullname;

    /*NOTE: I made the validation this way beucase I wanted to be able to display the particular error messages for each issue. 
    Instead of creating some type of function, I wanted the user to be able to see exactly what they were doing wrong by display the issue.
    */
    //if fullname is greater than 30, display error message
    if (!validatefullname(fullname)) {
        console.log(`Full name is more than 30 characters long`);
        response.send(`<script>
            alert("${fullname} is not valid. Please make sure it contains only letters and is shorter than 30 characters"); 
            window.history.back(); 
            
            </script>`);
    }
    else {
        var GoodName = true;
    }
    //if username is already defined, display error message
    if ((typeof user_reg_data[username] != 'undefined')) {
        console.log(`The username requested already exists`);
        response.send(`<script>
            alert("${username} already exists."); 
            window.history.back(); 
            
            </script>`);
    }
    else {
        var GoodUsername = true;
        //if username does not meet requirements from validate Username function (using regular expressions to check)
    }
    if (!validateUsername(username)) {
        console.log(`The username is to long or contains characters other than numbers and letters.`);
        response.send(`<script>
            alert("Your username:${username} is invalid. Please make sure that your password is between 4 and 10 characters (currently at ${username.length}) and only contains number and letters."); 
            window.history.back(); 
            
            </script>`);
    }
    else {
        var GoodUsernameLength = true;
    }
    //if password is not the same as second password, display error message
    if (password != second_password) {
        console.log(`Passwords do not match`);
        response.send(`<script>
            alert("Your passwords ${password} and ${second_password} do not match."); 
            window.history.back(); 
            
            </script>`);
    }
    else {
        var GoodPassword = true;
    }
    //if password is less than 6, display error message
    if (password.length < 6) {
        console.log(`Password is smaller than 6 characters`)
        response.send(`<script>
            alert("Your password ${password} is smaller than 6 characters."); 
            window.history.back(); 
            
            </script>`)
    }
    else {
        var GoodLength = true;
    }
    //if email does not meet requriments in validate email function, displa error message
    if (!validateEmail(email)) {
        console.log(`Email is invalid. Email must only contain letters, numbers, "_", and ".". Domains must be only three characters long.`)
        response.send(`<script>
            alert("Your email ${email} is not valid."); 
            window.history.back(); 
            
            </script>`)
    }
    else {
        var GoodEmail = true;
    }
    //Checks if every variable is true
    if (GoodUsername && GoodPassword && GoodLength && GoodEmail && GoodUsernameLength && GoodName) {
        console.log(`Valid registration`)
        username = request.body.username.toLowerCase(); //get username in lowercase
        user_reg_data[username] = {}; //create empty object for array with username
        user_reg_data[username].name = request.body.fullname; //Assigns full name to new object
        user_reg_data[username].password = request.body.password; //Assigns password to new object
        user_reg_data[username].email = request.body.email.toLowerCase(); //Assigns email to new object
        response.cookie(`username`, username, {maxAge: 300000});

        fs.writeFileSync(user_data_filename, JSON.stringify(user_reg_data)); //This will turn ___ into a string

        response.redirect(`./index.html`)
    }

});

//renders the checkout when requested. Will save username, fullname, and email variables to be used in the form that is loaded
app.get("/checkout", function (request, response) {
    username = request.cookies.username
    if (typeof user_reg_data[username] != `undefined`) {
        fullname = user_reg_data[username].name;
        email = user_reg_data[username].email;
        var contents = fs.readFileSync('./public/checkout.view', 'utf8');//So that the display_invoice_table_rows will be rendered with invoice.view
        response.send(eval('`' + contents + '`')); // render template string
    }
    else {
        response.send(`<script>
        alert("You have not logged in yet. Please login first!")
        window.location.href = "./login"
        </script>`)
    }
});

//will check that values in checkout is good. If it is, it will then forwad an email address to what the email address is.
app.get("/invoice", function (request, response) {
    // Generate HTML invoice string
    var checkoutvalues = [
        'fullname',
        'email',
        'address',
        'city',
        'cardname',
    ]

    for (i in checkoutvalues){
        if(request.query[checkoutvalues[i]] == ``){
                return response.send(`
                <script>
                alert("${[checkoutvalues[i]]} has no value")
                window.history.back()
                </script>
                `)                    
        }
    }
        if(!statecheck(request.query.state)){
            return response.send(`
            <script>
            alert("The State is Invalid")
            window.history.back()
            </script>
            `)       
        }
        if(!zipcodecheck(request.query.zip)){
            return response.send(`
            <script>
            alert("The Zipcode is Invalid")
            window.history.back()
            </script>
            `)       
        }
        if(!cardnumber(request.query.cardnumber)){
            return response.send(`
            <script>
            alert("The Credit Card Number is Invalid")
            window.history.back()
            </script>
            `)       
        }
        if(!expmonthcheck(request.query.expmonth)){
            return response.send(`
            <script>
            alert("The month is Invalid")
            window.history.back()
            </script>
            `)       
        }
        if(!expyearcheck(request.query.expyear)){
                return response.send(`
                <script>
                alert("The Year is Invalid")
                window.history.back()
                </script>
                `)       
            
        }
        if(!checkcvv(request.query.cvv)){
            return response.send(`
            <script>
            alert("The CVV is Invalid")
            window.history.back()
            </script>
            `)       
        }
    
    

    var invoice_str = `<!-- BEGIN INVOICE -->
    <head>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
    <link rel="stylesheet" href="product-style.css">
    </head>
        <div class="col-xs-12">
            <div class="grid invoice">
                <div class="grid-body">
                    <div class="invoice-title">
                        <div class="row">
                            <div class="col-xs-12">
                            </div>
                        </div>
                        <br>
                        <div class="row">
                            <div class="col-xs-12">
                                <h2>
                                    Invoice<br>
                                    <span class="small"></span></h2>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-xs-6">
                            <address>
                                <strong>Billed To:</strong><br>
                                ${request.query.fullname}<br>
                                ${request.query.state}<br>
                                ${request.query.city} ${request.query.zip}
                            </address>
                        </div>
                        <div class="col-xs-6 text-right">
                            <address>
                                <strong>Shipped To:</strong><br>
                                ${request.query.fullname}<br>
                                ${request.query.state}<br>
                                ${request.query.city} ${request.query.zip}
                            </address>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-xs-6">
                            <address>
                                <strong>Payment Method:</strong><br>
                                ${request.query.cardnumber} ${request.query.expmonth}/${request.query.expyear}<br>
                            </address>
                        </div>
                        <div class="col-xs-6 text-right">
                            <address>
                                <strong>Order Date:</strong><br>
                                ${Date()}
                            </address>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <h3>ORDER SUMMARY</h3>
                            <table class="table table-striped">
                                <thead>
                                    <tr class="line">
                                        <td><strong>ITEM</strong></td>
                                        <td class="text-center"><strong>QUANTITY</strong></td>
                                        <td class="text-center"><strong>PRICE</strong></td>
                                        <td class="text-right"><strong>EXTENDED PRICE</strong></td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>

                                        ${display_invoice_table_rows()}	
                                    
                                    <tr>
                                        <td colspan="2"></td>
                                        <td class="text-right"><strong>Subtotal</strong></td>
                                        <td class="text-right"><strong>$${subtotal.toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colspan="2"></td>
                                        <td class="text-right"><strong>Tax @
                                                ${(100 * tax_rate)}%</strong></td>
                                        <td class="text-right"><strong>$${tax.toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colspan="2"></td>
                                        <td class="text-right"><strong>Shipping</strong></td>
                                        <td class="text-right"><strong>$${shipping.toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colspan="2">
                                        </td>
                                        <td class="text-right"><strong>Total</strong></td>
                                        <td class="text-right"><strong>$${total.toFixed(2)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12 text-right identity">
                            <p>Invoice Generated From:<br><strong>Kai's Furniture Shop</strong></p>
                            <img class="logo" src="./images/SmallLogo.jpg" height="100" alt=""><br>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <!-- End of the invoie function. For the invoice print function. -->`

    // Set up mail server. Using custom credentials
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
          user: 'shopfurniture6@gmail.com',
          pass: 'VO0JJUp07u4e'
        }
      });

    
    var mailOptions = {
        from: 'shopfurniture6@gmail.com',
        to: request.query.email,
        subject: 'Your Furniture Shop Invoice',
        html: invoice_str
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            invoicemessage = `Thank you for your purchase ${request.query.fullname}. An email was sent to ${request.query.email}.`
        } else {
            invoicemessage = `Thank you for your purchase ${request.query.fullname}. An email was sent to ${request.query.email}.`
        }
        response.send(`<script>
        alert("${invoicemessage}")
        window.location = "./login"
        </script>`)
        request.session.destroy()
    });
    //loads values so that it can be used in the invoice. Since an empty array was created earlier. it will load these variables their
    invoicevalues = {
        email: request.query.email,
        cardname : request.query.cardname,
        city : request.query.city,
        fullname : request.query.fullname,
        state: request.query.state,
        zip: request.query.zip,
        cardnumber: request.query.cardnumber,
        expmonth: request.query.expmonth,
        expyear: request.query.expyear,
    }
});

//The GET request is from the login.html page. Whenver /login is used, they will be sent to login.html
app.get("/login", function (request, response) {
    username = request.cookies.username
    response.cookie(`username`, username, {maxAge: 300000});
    //console.log(request.cookies.username)
    if (typeof user_reg_data[username] != `undefined`) {
        fullname = user_reg_data[username].name;
        var contents = fs.readFileSync('./public/invoice.view', 'utf8'); //So that the display_invoice_table_rows will be rendered with invoice.view
        return response.send(eval('`' + contents + '`')); // render template string)
    }
    return response.redirect(`./login.html`)
});

app.get("/logout", function (request, response) {
    response.clearCookie("username").redirect(`./index.html`)
});

function isNonNegInt(q, return_errors = false) {
    errors = []; // assume no errors at first
    if (q == '') q = 0; // handle blank inputs as if they are 0
    if (Number(q) != q) errors.push('<font color="red">Not a number!</font>'); // Check if string is a number value
    if (q < 0) errors.push('<font color="red">Negative value!</font>'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('<font color="red">Not an integer!</font>'); // Check that it is an integer
    return return_errors ? errors : (errors.length == 0);
}
//Taken from an example on the internet. It takes the format from a regular expresion to validate emails. 
/*
Regular Expression Template: For the most part, I was able to following this format when creating the regular expressions for username and email.
[a-z] lower case letters
[A-Z] upper case letters
[0-9] all numbers
List individuals characters in same box
{,} used to define character length
*/
function validateEmail(email) {//used =@ and +\. to seperate sections of email
    const re = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.]+\.[a-z]{2,3}$/;
    return re.test(String(email).toLowerCase());
}
//Modified to be between 4-10 characters long.
function validateUsername(user) {
    const re = /^[a-zA-Z0-9]{4,10}$/;
    return re.test(String(user).toLowerCase());
}

function validatefullname(fullname) {
    const re = /^[ +a-zA-Z]{0,30}$/
    return re.test(String(fullname));
}
function checkcvv(cvv) {//numbers that have to be 3 characters long
    const re = /^[0-9]{3}$/;
    return re.test(String(cvv));
}
function cardnumber(cardnumber) {//numbers and can only be 16 characters long
    const re = /^[0-9]{16}$/;
    return re.test(String(cardnumber));
}
function statecheck(state) {//upper or lowercause values that are 2 charactesr long
    const re = /^[a-zA-Z]{2}$/;
    return re.test(String(state));
}
function zipcodecheck(zip) {//numbers that can only be 5 charactesr long
    const re = /^[0-9]{5}$/;
    return re.test(String(zip));
}
function expmonthcheck(month) {//can only be between 1-12 and be between 1 and 2 characters
    const re = /^[1-9][0-2]{1,2}$/;
    return re.test(String(month));
}
function expyearcheck(year) {//start with 20 and only contain two other digits after that
    const re = /^(20)\d{2}$/;
    return re.test(String(year));
}

//Taken from Assignment 1 example. 
function display_invoice_table_rows() {
    subtotal = 0;
    str = '';
    for (products_key in shopping_cart) {
        a_qty = 0;
        for (i = 0; i < products_data[products_key].length; i++) {
            if (shopping_cart[products_key][i] != undefined && shopping_cart[products_key][i] != 0) {
                a_qty = shopping_cart[products_key][i]
                if (a_qty > 0) {
                    // product row
                    extended_price = a_qty * products_data[products_key][i][`Price`]
                    subtotal += extended_price;
                    str += (`
      <tr>
        <td width="43%">${products_data[products_key][i]["Type"]}</td>
        <td align="center" width="11%">${shopping_cart[products_key][i]}</td>
        <td align="center">\$${products_data[products_key][i]['Price']}</td>
        <td align="right">\$${extended_price.toFixed(2)}</td>
      </tr>

      `);
                }

            }
        }
    }

    // Compute tax
    tax_rate = 0.0575;
    tax = tax_rate * subtotal;

    // Compute shipping
    if (subtotal <= 99.99) {
        shipping = 10;
    }
    else if (subtotal <= 299.99) {
        shipping = 20;
    }
    else {
        shipping = 0.15 * subtotal; // 5% of subtotal
    }

    // Compute grand total
    total = subtotal + tax + shipping;

    return str;

}

app.use(express.static('./public'));
app.listen(8080, () => console.log(`listening on port 8080`));