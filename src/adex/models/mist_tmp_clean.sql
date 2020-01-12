delete from mist_trades_tmp where (current_timestamp - created_at) > '25 hours';
delete from mist_orders_tmp where available_amount=0;
