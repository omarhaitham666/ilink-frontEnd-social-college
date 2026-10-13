
$(document).ready(function () {
    const $loginForm = $("#loginForm");
    const $email = $("#email");
    const $password = $("#password");
    const $message = $("#formMessage");
    const $button = $("#loginButton");

    $loginForm.on("submit", function (event) {
        event.preventDefault();

        const email = $email.val().trim();
        const password = $password.val();

        $message.text("");

        if (!email || !password) {
            $message.text("Please complete all required fields.");
            return;
        }

        $message.text(
            "The login interface is ready. Backend authentication is not connected yet."
        );
    });

    $("#forgotPassword").on("click", function (event) {
        event.preventDefault();

        $message.text(
            "Password recovery will be available when authentication is connected."
        );
    });
});
