$(function() {
	var deviceurl = window.location.href;
	var add_to_cart = $('#body-content > div.details-wrapper.devices.id-track-partial-impression.vs-enabled > div.details-info-wrapper > div > div.info-container > div.details-actions > span.buy-button-container > button');

	if (add_to_cart.is(':enabled')) {
		add_to_cart.click();

		chrome.storage.sync.get(
			{
				api_key: '',
				devices: []
			},
			function(items) {
				console.log('The device is available.');

				PushBullet.APIKey = items.api_key;
				console.log('Pushing to ' + items.devices.length + ' devices');

				$.each(items.devices, function(index, device_iden) {
					console.log('Pushing to device ' + index + ': ' + device_iden);
					PushBullet.push("link", device_iden, null, { title: "Device available!", url: deviceurl });
				});

				$('#hardware-checkout').click();
			}
		);
	}
	else {
		chrome.storage.sync.get(
			{
				refresh_interval: 1000
			},
			function(items) {
				setTimeout(
					function() {
						window.location.reload();
					},
					items.refresh_interval
				);
			}
		);
	}
});
