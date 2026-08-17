import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';

const ListBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY

    const {axios, getToken, user} = useAppContext()

    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
      const getAllBookings = async () => {
        try {
          const token = await getToken()

          if(!token){
            setIsLoading(false);
            return;
          }

          const { data } = await axios.get("/api/admin/all-bookings", {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (data.success) {
            setBookings(data.bookings);
          }
        } catch (error) {
          console.error(error);
        }

        setIsLoading(false);
      };

      if (user) {
        getAllBookings();
      }
    }, [axios, getToken, user]);


  return !isLoading ? (
    <>
      <Title text1="List" text2="Bookings" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse  rounded-md overflow-hidden text-nowrap">
            <thead>
                <tr className="bg-primary/20 text-left text-white">
                    <th className="p-2 font-medium pl-5">User</th>
                    <th className="p-2 font-medium">Movie Name</th>
                    <th className="p-2 font-medium">Show Time</th>
                    <th className="p-2 font-medium">Seats</th>
                    <th className="p-2 font-medium">Amount</th>
                </tr>
            </thead>
            <tbody className="text-sm font-light">
                {bookings.map((item) => (
                    <tr key={item._id} className="border-b border-primary/20 bg-primary/5 even:bg-primary/10">
                        <td className="p-2 min-w-45 pl-5">
                          <span className="font-medium">{item.user?.name || "Unknown User"}</span>
                        </td>
                        <td className="p-2">{item.show?.movie?.title || "Unknown Movie"}</td>
                        <td className="p-2">{item.show?.showDateTime ? dateFormat(item.show.showDateTime) : "N/A"}</td>
                        <td className="p-2">{Array.isArray(item.bookedSeats) ? item.bookedSeats.join(", ") : ""}</td>
                        <td className="p-2">{currency} {item.amount}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </>
  ) : <Loading />
}

export default ListBookings
