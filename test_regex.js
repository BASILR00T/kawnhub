const html = `
<section class="section">
    <p>Before configuring servers, you need to set up the virtual environment.</p>
    <div class="video-container">
        <iframe width="1260" height="709" src="https://www.youtube.com/embed/eLGfBJI1yXs" title="Setup VMs for NOS" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
</section>
`;

const regex = /<div class="video-container">[\s\S]*?<iframe[^>]+src="([^"]+)"[\s\S]*?<\/iframe>[\s\S]*?<\/div>/;
const match = html.match(regex);

console.log("Match:", match);
if (match) {
    console.log("URL:", match[1]);
} else {
    console.log("No match found.");
}
