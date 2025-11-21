const
    // set the name of your shop here
    shopID = 'Bioshield',
    // match the following attributes to the classes on your products
    productClass = 'product',
    imageClass = 'prodImage',
    nameClass = 'prodName',
    descClass = 'prodDesc',
    priceClass = 'prodPrice',
    // match the following attributes to your cart total elements
    cartTotalID = 'cartTotal',
    cartItemCountID = 'cartItemCount';


// check if shop exists in local storage, create it if not
if (localStorage.getItem(shopID) === null) {
    localStorage.setItem(shopID, JSON.stringify({ cart: [] }));
}

//initialize the shop object
let shop = JSON.parse(localStorage.getItem(shopID));

// Define the Product class
class Product {
    constructor(name, desc, price, imgSrc, qty = 1) {
        this.name = name;
        this.desc = desc;
        this.price = price;
        this.imgSrc = imgSrc;
        this.qty = qty;
    }
}

// Format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
};

function addToCart(e) {
    // prevent default link behavior
    e.preventDefault();

    // Find the main product container, regardless of where the button is inside it
    const productContainer = e.target.closest(`.${productClass}`);
    if (!productContainer) {
        console.error("Could not find product container!");
        return;
    }
    // Find elements by class name *within* that container
    const name = productContainer.querySelector(`.${nameClass}`)?.innerText;
    const desc = productContainer.querySelector(`.${descClass}`)?.innerText;
    const priceText = productContainer.querySelector(`.${priceClass}`)?.innerText;
    const imgElem = productContainer.querySelector(`.${imageClass}`);
    const price = parseFloat(priceText?.replace(/[^0-9.]/g, ''));
    const imgSrc = imgElem?.currentSrc || imgElem?.src;
    // check that all product attributes exist, if not, error and exit function
    if (!name || !desc || isNaN(price) || !imgSrc) {
        console.error("Error: Missing product information. Check class names or DOM structure.");
        return;
    }

    // check if the item is already in the cart
    const existingItem = shop.cart.find(item => item.name === name);
    if (existingItem) {
        // if it is, increase the quantity
        existingItem.qty++;
        // update local storage
        localStorage.setItem(shopID, JSON.stringify(shop));
        // update cart totals
        updateCartTotals();
        return;
    }
    // if not, create a new product and add it to the cart
    shop.cart.push(new Product(name, desc, price, imgSrc));
    // update local storage
    localStorage.setItem(shopID, JSON.stringify(shop));
    // update cart totals
    updateCartTotals();
}

// Calculate cart total and item count
function cartTotal() {
    if (shop.cart.length === 0) return [0, 0];
    // use reduce to calculate total and item count
    return shop.cart.reduce(
        // accumulator function
        (acc, item) => {
            acc[0] += item.price * item.qty;
            acc[1] += item.qty;
            return acc;
        },
        // initial value
        [0, 0]
    );
}

// Update cart totals
function updateCartTotals() {
    // get total and item count from cartTotal function
    const [total, itemCount] = cartTotal();
    // get the elements to update
    const totalElem = document.getElementById(cartTotalID);
    const countElem = document.getElementById(cartItemCountID);
    // Check if elements exist before updating
    if (totalElem) totalElem.innerHTML = formatCurrency(total);
    if (countElem) countElem.innerHTML = itemCount;
}

// Render cart
function updateCart() {
    // get the cart container
    const cartContainer = document.getElementById('cart');
    // if it doesn't exist, exit the function
    if (!cartContainer) {
        console.error("Cart container not found!");
        return false;
    }
    // if cart is empty, display message and exit function
    if (shop.cart.length === 0) {
        cartContainer.innerHTML = '<h3>Your cart is empty</h3>';
        return true;
    }
    // empty cart HTML string and total variable
    let cartHTML = '';
    let total = 0;
    // loop through cart and build HTML
    shop.cart.forEach((item, index) => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        cartHTML += `
            <div class="cartItem">
                <img src="${item.imgSrc}" alt="${item.name}">
                <div class="cartItemInfo">
                    <h3>${item.name}</h3>
                    <p>${item.desc}</p>
                    <div class="cartItemPricing">
                        <p>Price: ${formatCurrency(item.price)}</p>
                        <p>
                            Quantity:
                            <button class="qtyBtn decreaseBtn" data-index="${index}">-</button>
                            ${item.qty}
                            <button class="qtyBtn increaseBtn" data-index="${index}">+</button>
                        </p>
                        <p>Subtotal: ${formatCurrency(subtotal)}</p>
                        <a href="#" class="removeBtn" data-index="${index}">Remove</a>
                    </div>
                </div>
            </div>
        `;
    });
    // add total and empty cart button
    cartHTML += `
        <div class="cartTotal">
            <h3>Total: ${formatCurrency(total)}</h3>
            <a href="#" id="emptyCart">Empty Cart</a>
        </div>
    `;
    // render the cart HTML
    cartContainer.innerHTML = cartHTML;

    // add event listeners to remove buttons
    document.querySelectorAll('.removeBtn').forEach(btn =>
        btn.addEventListener('click', removeItem)
    );
    // add events to quantity adjustment buttons
    document.querySelectorAll('.increaseBtn').forEach(btn =>
        btn.addEventListener('click', increaseQty)
    );

    document.querySelectorAll('.decreaseBtn').forEach(btn =>
        btn.addEventListener('click', decreaseQty)
    );
    // add event listener to empty cart button
    document.getElementById('emptyCart').addEventListener('click', emptyCart);
}

function removeItem(e) {
    // prevent default link behavior
    e.preventDefault();

    // get the index of the item to remove from data attribute
    const index = parseInt(e.target.dataset.index);
    if (!isNaN(index)) {
        // remove item from cart
        shop.cart.splice(index, 1);

        // update local storage
        localStorage.setItem(shopID, JSON.stringify(shop));

        // re-render the cart
        updateCart();
        updateCartTotals();
        return true;
    } else {
        // if index is not found, log error  
        console.error("Could not determine item index to remove.");
        return false;
    }
}

// Increase quantity function
function increaseQty(e) {
    e.preventDefault();
    const index = parseInt(e.target.dataset.index);
    if (!isNaN(index) && shop.cart[index]) {
        shop.cart[index].qty++;
        localStorage.setItem(shopID, JSON.stringify(shop)); 
        // re-render the cart
        updateCart();
        updateCartTotals();  // Also update totals in the header/sidebar
    }
}

// Decrease quantity function
function decreaseQty(e) {
    e.preventDefault();
    const index = parseInt(e.target.dataset.index);
    if (!isNaN(index) && shop.cart[index]) {
        if (shop.cart[index].qty > 1) {
            shop.cart[index].qty--;
        } else {
            // Optionally, remove item if qty reaches 0 or 1 and user decreases again
            shop.cart.splice(index, 1);
        }
        localStorage.setItem(shopID, JSON.stringify(shop));
        // re-render the cart
        updateCart();
        updateCartTotals();  // Also update totals in the header/sidebar
    }
}

function emptyCart() {
    // empty cart
    shop.cart = [];

    // update local storage
    localStorage.setItem(shopID, JSON.stringify(shop));

    // re-render the cart
    updateCart();
    updateCartTotals(); // Also update totals in the header/sidebar
}

// Add Event listners when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // add event listeners to all add to cart buttons
    const cartButtons = document.querySelectorAll('.addToCart');
    cartButtons.forEach(button => button.addEventListener('click', addToCart));

    // if cart element exists, render the cart
    if (document.getElementById('cart')) {
        updateCart();
    }

    // update cart totals in header/sidebar
    updateCartTotals();

    // for debugging, log the shop object to the console
    console.log("Ready", shop.cart);
});