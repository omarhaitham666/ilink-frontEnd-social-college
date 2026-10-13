
$(document).ready(function () {
    const $form = $("#registerForm");
    const $fullName = $("#fullName");
    const $email = $("#email");
    const $university = $("#university");
    const $password = $("#password");
    const $confirmPassword = $("#confirmPassword");
    const $message = $("#formMessage");
    const $button = $("#registerButton");
    const $name = $("#name");

    if (!$form.length) {
        return;
    }

    $form.on("submit", function (e) {
        e.preventDefault();

        const fullName = $fullName.val().trim();
        const email = $email.val().trim();
        const university = $university.val().trim();
        const password = $password.val();
        const confirmPassword = $confirmPassword.val();

        $message.text("").removeClass("success error");

        if (
            !fullName ||
            !email ||
            !university ||
            !password ||
            !confirmPassword
        ) {
            showMessage("Please fill in all fields.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.", "error");
            return;
        }

        const nameParts = fullName.split(/\s+/);
        const firstName = nameParts[0];

        $button.prop("disabled", true).text("Creating account...");

        api.post("/api/register", {
            first_name: firstName,
            email: email,
            university: university,
            password: password,
            password_confirmation: confirmPassword
        })
        .done(function (response) {
            showMessage(
                response.message || "Account created successfully!",
                "success"
            );

            $form[0].reset();

            // هنضيف التوجيه للصفحة التالية بعد التأكد من الـ Session.
        })
        .fail(function (xhr) {
            if (xhr.status === 422 && xhr.responseJSON?.errors) {
                const errors = xhr.responseJSON.errors;
                const firstError = Object.values(errors)[0]?.[0];

                showMessage(
                    firstError || "Please check your information.",
                    "error"
                );
                return;
            }

            if (xhr.status === 419) {
                showMessage(
                    "Your security token expired. Please try again.",
                    "error"
                );
                return;
            }

            showMessage(
                "Registration failed. Please try again.",
                "error"
            );

            console.error("Registration error:", xhr.status, xhr.responseText);
        })
        .always(function () {
            $button.prop("disabled", false).text("Create Account");
        });
    });

    function showMessage(message, type) {
        $message
            .text(message)
            .removeClass("success error")
            .addClass(type);
    }
});
