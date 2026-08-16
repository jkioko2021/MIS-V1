<%@ Control Language="VB" AutoEventWireup="false" CodeFile="Accounts.ascx.vb"  Inherits="Accounts" %>
<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Web.UI" TagPrefix="telerik" %>

<fieldset style="background-color: #e5eff7; padding:5px;">
    <legend>ACCOUNT DETAILS</legend>
    <table>
        <tr>
            <td colspan="6" style="background-color:#085C8B;">
                <asp:Label ID="Label34" runat="server" Font-Bold="True" Text="Mandatory Information"
                    ForeColor="White"></asp:Label>
            </td>
        </tr>
        <tr>
            <td>
                <asp:Label ID="Label13" runat="server" Text="Client No"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label14" runat="server" Text="Account No"></asp:Label>
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
            <td>
            </td>
        </tr>
        <tr>
            <td>
                <telerik:RadTextBox ID="txtcno" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.CNo" ) %>'
                    Width="180px" Enabled="False" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                <telerik:RadTextBox ID="txtano" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.ACC_NO" ) %>'
                    Width="180px" Enabled="False" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
        </tr>
        <tr>
            <td>
                <asp:Label ID="Label1" runat="server" Text="Account Indicator"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label2" runat="server" Text="Account Holder Type"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label3" runat="server" Text="Account Prod Type"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label4" runat="server" Text="Date Account Opened"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label10" runat="server" Text="NPL Indicator"></asp:Label>
            </td>
            <td>
                &nbsp;
            </td>
        </tr>
        <tr>
            <td>
                <telerik:RadComboBox ID="cboaccindicator" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.ACC_JOINT_SINGLE" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadComboBox>
            </td>
            <td>
                <telerik:RadComboBox ID="cboaccholdertype" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.ACC_HOLDER_TYPE" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadComboBox>
            </td>
            <td>
                <telerik:RadComboBox ID="cboaccprodtype" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.ACC_PROD_TYPE" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadComboBox>
            </td>
            <td>
                <telerik:RadDatePicker ID="txtdateopened" runat="server" SelectedDate='<%# DataBinder.Eval( Container, "DataItem.DATE_ACC_OPENED" ) %>'
                    Width="180px" Skin="Office2007"  MinDate="1800-01-01">
                    <Calendar UseRowHeadersAsSelectors="False" UseColumnHeadersAsSelectors="False" ViewSelectorText="x" runat="server"
                        Skin="Office2007">
                    </Calendar>
                    <DateInput DisplayDateFormat="dd-MMM-yyyy" DateFormat="dd-MMM-yyyy" runat="server">
                    </DateInput>
                    <DatePopupButton ImageUrl="" HoverImageUrl=""></DatePopupButton>
                </telerik:RadDatePicker>
            </td>
            <td>
                <telerik:RadComboBox ID="cbonplindicator" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.NPL_INDICATOR" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadComboBox>
            </td>
        </tr>
        <tr>
            <td>
                <asp:Label ID="Label6" runat="server" Text="Account Currency"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label7" runat="server" Text="Original Amount"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label5" runat="server" Text="Amount In KES"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label8" runat="server" Text="Current Bal"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label9" runat="server" Text="Days In Arrears"></asp:Label>
            </td>
        </tr>
        <tr>
            <td>
                <telerik:RadComboBox ID="LstAccCurrency" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.CURRENCY" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadComboBox>
            </td>
            <td>
                <telerik:RadTextBox ID="txtorigamt" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.ORIG_AMOUNT" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                <telerik:RadTextBox ID="TxtKesEquiv" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.KES_EQUIV" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                <telerik:RadTextBox ID="txtcurrbal" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.CURRENT_BAL" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                <telerik:RadTextBox ID="txtdaysinarrear" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.NO_DAYSIN_ARREARS" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
        </tr>
        <tr>
            <td>
                <asp:Label ID="Label12" runat="server" Text="Type of Security"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label11" runat="server" Text="Account Status Date"></asp:Label>
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
        </tr>
        <tr>
            <td>
                <telerik:RadComboBox ID="cbosectype" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.SEC_TYPE" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadComboBox>
            </td>
            <td>
                <telerik:RadDatePicker ID="txtaccstatusdate" runat="server" SelectedDate='<%# DataBinder.Eval( Container, "DataItem.ACC_STATUS_DATE" ) %>'
                    Width="180px" Skin="Office2007"  MinDate="1800-01-01">
                    <Calendar UseRowHeadersAsSelectors="False" UseColumnHeadersAsSelectors="False" ViewSelectorText="x"
                        Skin="Office2007" runat="server">
                    </Calendar>
                    <DateInput DisplayDateFormat="dd-MMM-yyyy" DateFormat="dd-MMM-yyyy" runat="server">
                    </DateInput>
                    <DatePopupButton ImageUrl="" HoverImageUrl=""></DatePopupButton>
                </telerik:RadDatePicker>
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
        </tr>
    </table>
</fieldset>
<fieldset style="padding:5px;">
    <legend>Additional Account Information</legend>
    <table>
        <tr>
            <td>
                <asp:Label ID="Label30" runat="server" Text="Payment Due Date"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label31" runat="server" Text="OverDue Bal"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label32" runat="server" Text="OverDue Date"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label33" runat="server" Text="Account Status"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label35" runat="server" Text="Account Closure Reason"></asp:Label>
            </td>
        </tr>
        <tr>
            <td>
                <telerik:RadDatePicker ID="txtduedate" runat="server" SelectedDate='<%# DataBinder.Eval( Container, "DataItem.PAYMENT_DUE_DATE" ) %>'
                    Width="180px" Skin="Office2007" MinDate="1800-01-01">
                    <Calendar UseRowHeadersAsSelectors="False" UseColumnHeadersAsSelectors="False" ViewSelectorText="x" runat="server"
                        Skin="Office2007">
                    </Calendar>
                    <DateInput DisplayDateFormat="dd-MMM-yyyy" DateFormat="dd-MMM-yyyy" runat="server">
                    </DateInput>
                    <DatePopupButton ImageUrl="" HoverImageUrl=""></DatePopupButton>
                </telerik:RadDatePicker>
            </td>
            <td>
                <telerik:RadTextBox ID="txtoverduebal" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.OVERDUE_BAL" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                <telerik:RadDatePicker ID="txtoverduedate" runat="server" SelectedDate='<%# DataBinder.Eval( Container, "DataItem.OVERDUE_DATE" ) %>'
                    Width="180px" Skin="Office2007" MinDate="1800-01-01">
                    <Calendar UseRowHeadersAsSelectors="False" UseColumnHeadersAsSelectors="False" ViewSelectorText="x" runat="server"
                        Skin="Office2007">
                    </Calendar>
                    <DateInput DisplayDateFormat="dd-MMM-yyyy" DateFormat="dd-MMM-yyyy" runat="server">
                    </DateInput>
                    <DatePopupButton ImageUrl="" HoverImageUrl=""></DatePopupButton>
                </telerik:RadDatePicker>
            </td>
            <td>
                <telerik:RadComboBox ID="cboaccstatus" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.ACC_STATUS" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadComboBox>
            </td>
            <td>
                <telerik:RadComboBox ID="cboaccclosurereason" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.ACC_CLOSURE_REASON" ) %>'
                    Width="180px" Skin="Office2007">
                    <Items>
                        <telerik:RadComboBoxItem runat="server" Text="PERFORMING" Value="A" />
                    </Items>
                </telerik:RadComboBox>
            </td>
        </tr>
        <tr>
            <td>
                <asp:Label ID="Label36" runat="server" Text="Repayment Period"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label37" runat="server" Text="Deferred Payment Date"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label38" runat="server" Text="Deferred Payment Amt"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label39" runat="server" Text="Payment Frequency"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label40" runat="server" Text="Date of First Payment"></asp:Label>
            </td>
        </tr>
        <tr>
            <td>
                <telerik:RadTextBox ID="txtrepaymentperiod" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.REPAYMENT_PERIOD" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                <telerik:RadDatePicker ID="txtdeferredpaydate" runat="server" SelectedDate='<%# DataBinder.Eval( Container, "DataItem.DEFERRED_PAY_DT" ) %>'
                    Width="180px" Skin="Office2007" MinDate="1800-01-01">
                    <Calendar UseRowHeadersAsSelectors="False" UseColumnHeadersAsSelectors="False" ViewSelectorText="x"
                        Skin="Office2007">
                    </Calendar>
                    <DateInput DisplayDateFormat="dd-MMM-yyyy" DateFormat="dd-MMM-yyyy">
                    </DateInput>
                    <DatePopupButton ImageUrl="" HoverImageUrl=""></DatePopupButton>
                </telerik:RadDatePicker>
            </td>
            <td>
                <telerik:RadTextBox ID="txtdeferedpayamt" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.DEFERRED_PAY_AMT" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                <telerik:RadComboBox ID="cbopayfrequ" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.PAYMENT_FREQ" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadComboBox>
            </td>
            <td>
                <telerik:RadDatePicker ID="txtfirstpaydate" runat="server" SelectedDate='<%# DataBinder.Eval( Container, "DataItem.DATE_FIRST_PAY" ) %>'
                    Width="180px" Skin="Office2007" MinDate="1800-01-01">
                    <Calendar UseRowHeadersAsSelectors="False" UseColumnHeadersAsSelectors="False" ViewSelectorText="x" runat="server"
                        Skin="Office2007">
                    </Calendar>
                    <DateInput DisplayDateFormat="dd-MMM-yyyy" DateFormat="dd-MMM-yyyy" runat="server">
                    </DateInput>
                    <DatePopupButton ImageUrl="" HoverImageUrl=""></DatePopupButton>
                </telerik:RadDatePicker>
            </td>
        </tr>
        <tr>
            <td>
                <asp:Label ID="Label41" runat="server" Text="First Payment Amt"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label42" runat="server" Text="Date Of Last Payment"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label43" runat="server" Text="Last Payment Amount"></asp:Label>
            </td>
            <td>
                <asp:Label ID="Label44" runat="server" Text="No Instalment In arrears"></asp:Label>
            </td>
            <td>
                &nbsp;
            </td>
        </tr>
        <tr>
            <td>
                <telerik:RadTextBox ID="txtfirstpayamt" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.FIRST_PAY_AMT" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                <telerik:RadDatePicker ID="txtlastpaydate" runat="server" SelectedDate='<%# DataBinder.Eval( Container, "DataItem.DATE_LAST_PAY" ) %>'
                    Width="180px" Skin="Office2007" MinDate="1800-01-01">
                    <Calendar UseRowHeadersAsSelectors="False" UseColumnHeadersAsSelectors="False" ViewSelectorText="x" runat="server"
                        Skin="Office2007">
                    </Calendar>
                    <DateInput DisplayDateFormat="dd-MMM-yyyy" DateFormat="dd-MMM-yyyy" runat="server">
                    </DateInput>
                    <DatePopupButton ImageUrl="" HoverImageUrl=""></DatePopupButton>
                </telerik:RadDatePicker>
            </td>
            <td>
                <telerik:RadTextBox ID="txtlastpayamt" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.LAST_PAY_AMT" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                <telerik:RadTextBox ID="txtnoofinstallinarears" runat="server" Text='<%# DataBinder.Eval( Container, "DataItem.NO_INSTAL_INARREARS" ) %>'
                    Width="180px" Skin="Office2007">
                </telerik:RadTextBox>
            </td>
            <td>
                &nbsp;
            </td>
        </tr>
        <tr>
            <td colspan="5"></td>
        </tr>
        <tr>
            <td>
                <telerik:RadButton ID="cmdupdate" runat="server" Skin="Outlook" Text="Update" CommandName="Update" Width="200px">
                </telerik:RadButton>
            </td>
            <td colspan="2">
                <telerik:RadButton ID="RadButton2" runat="server" Skin="Outlook" Text="CANCEL" CommandName="Cancel" Width="100px">
                </telerik:RadButton>
            </td>
            <td>
                &nbsp;
            </td>
            <td>
                &nbsp;
            </td>
        </tr>
        <tr>
            <td colspan="5">&nbsp;</td>
        </tr>
        <tr>
            <td colspan="5">&nbsp;</td>
        </tr>
    </table>
</fieldset>
