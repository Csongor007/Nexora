// Navigáció elrejtése/megjelenítése görgetéskor
let lastScrollTop = 0;
window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > lastScrollTop) {
        header.classList.add("hidden");
    } else {
        header.classList.remove("hidden");
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});

// Mobil menü kapcsoló
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".nav-menu");
    const navMenu2 = document.querySelector(".nav-menu2");

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            navMenu2.classList.toggle("active");
        });
    }
});

// D3 Részecske háttér animáció
const particleCount = 150;
const w = window.innerWidth;
const h = window.innerHeight;

const svg = d3.select("#particle-background").append("svg")
    .attr("width", w)
    .attr("height", h);
    
const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 3 + 1,
    speedY: Math.random() * 1 + 0.5,
    opacity: Math.random() * 0.5 + 0.3,
}));

const circles = svg.selectAll("circle")
    .data(particles)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.radius)
    .style("fill", "#0f0")
    .style("opacity", d => d.opacity);

function animateParticles() {
    circles.each(function(d) {
        d.y += d.speedY;
        if (d.y > h) {
            d.y = 0;
            d.x = Math.random() * w;
        }
    })
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
    requestAnimationFrame(animateParticles);
}
animateParticles();