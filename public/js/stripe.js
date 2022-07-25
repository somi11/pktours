import axios from 'axios';
import { showAlert } from './alerts';
// const stripe = Stripe(
//   'pk_test_51LOKGtAMMhu8yzJgxR0dbA97GSJz2phO73BmTVxuzjKIUFRE7a0mnrJJuF7DTx4IsLBWjiwPKJCrnYKdwY5biwj400k3cmHJTa'
// );
export const bookTour = async tourId => {
  //   //1 get checkout session from Api
  //   const session = await axios(
  //     `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tour.id}`
  //   );
  //   console.log(session);
  //   // create checkout form + charge credit card
  try {
    const session = await axios({
      method: 'GET',
      url: `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`
    });
    if (session) {
      console.log(session.data.sess);
      location.assign(session.data.sess);
      //showAlert('success', 'Processing');
      //res.redirect(303, data.session.url);
      //location.load(session.url);
    }
  } catch (err) {
    //showAlert('error', err.response.data.message);
    console.log(err);
  }
};
